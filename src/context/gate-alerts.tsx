import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import type { FeedStatus } from '@/components/plates/live-status';
import { isGateRole } from '@/constants/roles';
import { apiMessage } from '@/lib/api-messages';
import { ApiError } from '@/lib/http';
import { gateService, type GateAlert } from '@/services/gate.service';
import { useSession } from './session';

/** Igual que el historial: el lector tarda unos segundos en cerrar el paso de un carro. */
const POLL_MS = 3000;

const ALERT_SOUND = require('../../assets/sounds/alerta.wav');

type GateAlertsValue = {
  /** Solo Portería y Administración reciben alertas. */
  enabled: boolean;
  pending: GateAlert[];
  resolvedToday: GateAlert[];
  status: FeedStatus;
  error: string | null;
  /** La que acaba de entrar: se muestra encima de todo hasta que la persona decide. */
  incoming: GateAlert | null;
  /** Cuántas otras entraron mientras `incoming` seguía en pantalla. */
  queued: number;
  /** "Ver después": las alertas siguen pendientes en la franja y en Alertas, pero dejan de tapar la pantalla. */
  dismissIncoming: () => void;
  refresh: () => Promise<void>;
  pendingPlates: ReadonlySet<string>;
  /** Las alertas de hoy por id, para que el historial muestre cómo se resolvió cada una. */
  alertsById: ReadonlyMap<number, GateAlert>;
};

const GateAlertsContext = createContext<GateAlertsValue | null>(null);

export function GateAlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const enabled = isGateRole(user?.role?.name);

  const [pending, setPending] = useState<GateAlert[]>([]);
  const [resolvedToday, setResolvedToday] = useState<GateAlert[]>([]);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<GateAlert[]>([]);

  // Lecturas ya vistas por alerta: si sube, la misma placa volvió a entrar sin resolverse.
  const seen = useRef<Map<number, number> | null>(null);
  const player = useAudioPlayer(ALERT_SOUND);

  useEffect(() => {
    // Una alerta de seguridad tiene que sonar aunque el celular esté en silencio.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const announce = useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // Sin audio (navegador sin permiso de reproducir) la alerta igual se ve.
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [player]);

  const apply = useCallback(
    (next: { pending: GateAlert[]; resolvedToday: GateAlert[] }) => {
      const known = seen.current;
      const arrived = known
        ? next.pending.filter((alert) => (known.get(alert.id) ?? 0) < alert.readsCount)
        : [];

      seen.current = new Map(next.pending.map((alert) => [alert.id, alert.readsCount]));
      setPending(next.pending);
      setResolvedToday(next.resolvedToday);

      const pendingIds = new Set(next.pending.map((alert) => alert.id));
      setIncoming((current) => {
        // Lo que ya se resolvió (aquí o en otro equipo) deja de tapar la pantalla.
        const still = current
          .filter((alert) => pendingIds.has(alert.id))
          .map((alert) => next.pending.find((item) => item.id === alert.id) ?? alert);
        const fresh = arrived.filter((alert) => !still.some((item) => item.id === alert.id));
        return [...fresh, ...still];
      });

      if (arrived.length) announce();
    },
    [announce],
  );

  const refresh = useCallback(async () => {
    try {
      apply(await gateService.alerts());
      setStatus('live');
      setError(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setStatus('forbidden');
      } else {
        setStatus('offline');
      }
      setError(apiMessage(caught, 'No pudimos revisar las alertas de portería.'));
    }
  }, [apply]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      await refresh();
      if (active) timer = setTimeout(() => void tick(), POLL_MS);
    }

    void tick();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, refresh]);

  // Se apartan todas las de la cola: siguen en la franja roja y en Alertas, y cerrar una
  // ventana por cada carro que entró mientras el vigilante no miraba no aporta nada.
  const dismissIncoming = useCallback(() => {
    setIncoming([]);
  }, []);

  const value = useMemo<GateAlertsValue>(
    () => ({
      enabled,
      pending,
      resolvedToday,
      status,
      error,
      incoming: incoming[0] ?? null,
      queued: Math.max(incoming.length - 1, 0),
      dismissIncoming,
      refresh,
      pendingPlates: new Set(pending.map((alert) => alert.licensePlateNumber)),
      alertsById: new Map([...pending, ...resolvedToday].map((alert) => [alert.id, alert])),
    }),
    [enabled, pending, resolvedToday, status, error, incoming, dismissIncoming, refresh],
  );

  return <GateAlertsContext.Provider value={value}>{children}</GateAlertsContext.Provider>;
}

export function useGateAlerts(): GateAlertsValue {
  const context = useContext(GateAlertsContext);

  if (!context) {
    throw new Error('useGateAlerts debe usarse dentro de <GateAlertsProvider>');
  }

  return context;
}
