import { useEffect, useRef, useState } from 'react';

import { useGateAlerts } from '@/context/gate-alerts';
import { apiMessage } from '@/lib/api-messages';
import { ApiError } from '@/lib/http';
import {
  plateReadService,
  type PlateRead,
  type PlateReadSummary,
} from '@/services/plate-read.service';
import type { FeedStatus } from './live-status';

/** Cada cuánto se piden lecturas nuevas. El lector tarda unos segundos en cerrar un paso. */
const POLL_MS = 3000;

/** Tope de filas en memoria: portería mira lo reciente, no el archivo completo. */
const MAX_ITEMS = 150;

/**
 * Suma las lecturas nuevas y quita las corregidas (soft delete). Se ordena por hora del paso, no
 * por id: una corrección es una fila nueva con la hora de la lectura original.
 */
function merge(current: PlateRead[], incoming: PlateRead[], removedIds: number[]): PlateRead[] {
  const removed = new Set(removedIds);
  const byId = new Map<number, PlateRead>();
  for (const read of [...current, ...incoming]) {
    if (!removed.has(read.id)) byId.set(read.id, read);
  }
  return [...byId.values()]
    .sort((a, b) => b.seenAt.localeCompare(a.seenAt) || b.id - a.id)
    .slice(0, MAX_ITEMS);
}

/**
 * Historial de placas en vivo: consulta cada pocos segundos solo lo nuevo desde la última
 * lectura vista. Lo usan el historial (celular y web) y la consola de detección.
 */
export function usePlateFeed() {
  const [reads, setReads] = useState<PlateRead[]>([]);
  const [summary, setSummary] = useState<PlateReadSummary | null>(null);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastId = useRef(0);
  const serverTime = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const result = await plateReadService.list(lastId.current || undefined, serverTime.current);
        if (!active) return;

        serverTime.current = result.serverTime;
        if (result.reads.length || result.deletedIds.length) {
          lastId.current = Math.max(lastId.current, ...result.reads.map((read) => read.id));
          setReads((current) => merge(current, result.reads, result.deletedIds));
        }
        setSummary(result.summary);
        setStatus('live');
        setError(null);
      } catch (caught) {
        if (!active) return;

        if (caught instanceof ApiError && caught.status === 403) {
          setStatus('forbidden');
          setError(apiMessage(caught, 'Esta sección es solo para Portería.'));
          return;
        }
        setStatus('offline');
        setError(apiMessage(caught, 'No pudimos actualizar el historial.'));
      }

      timer = setTimeout(() => void tick(), POLL_MS);
    }

    void tick();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // "Hace 2 min" tiene que avanzar aunque no lleguen lecturas nuevas.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // El historial solo pide lecturas nuevas; el estado de la alerta de las ya cargadas (inscrita,
  // visita autorizada) llega por las alertas, que se revisan aparte cada pocos segundos.
  const { alertsById } = useGateAlerts();
  const current = reads.map((read) => {
    const alert = read.alert ? alertsById.get(read.alert.id) : undefined;
    if (!alert || !read.alert || alert.status === read.alert.status) return read;
    return {
      ...read,
      alert: {
        ...read.alert,
        status: alert.status,
        resolutionNote: alert.resolutionNote,
        resolvedAt: alert.resolvedAt,
      },
    };
  });

  /** Tras corregir una lectura aquí mismo: la nueva reemplaza a la vieja sin esperar la consulta. */
  function replaceRead(replacedId: number, read: PlateRead) {
    lastId.current = Math.max(lastId.current, read.id);
    setReads((list) => merge(list, [read], [replacedId]));
  }

  return { reads: current, summary, status, error, now, replaceRead };
}
