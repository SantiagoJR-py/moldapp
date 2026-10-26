import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { plateCard } from '@/components/plates/styles';
import { PencilIcon, RestoreIcon, TrashIcon, VideoIcon } from '@/components/ui/icons';
import { palette } from '@/constants/theme';
import { relativeTime } from '@/lib/time';
import { gateService, type GateActivity } from '@/services/gate.service';

/** Los cambios no llegan seguido: con revisarlos cada tanto basta. */
const POLL_MS = 10000;

const DIRECTION_LABEL: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  AUTO: 'Automático',
};

/** Cambios recientes de portería (cámaras y lecturas corregidas), con quién y cuándo. */
export function useGateActivity(): GateActivity[] | null {
  const [activity, setActivity] = useState<GateActivity[] | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const next = await gateService.activity();
        if (alive) setActivity(next);
      } catch {
        // Sin conexión se deja lo último que se vio; el resto de la pantalla ya lo avisa.
      }
      if (alive) timer = setTimeout(() => void tick(), POLL_MS);
    }

    void tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return activity;
}

function describe(item: GateActivity): { title: string; detail: string | null } {
  const who = item.by ?? 'Alguien de portería';

  if (item.kind === 'camera') {
    if (item.action === 'REMOVED') {
      return { title: `${who} quitó la cámara ${item.cameraName}`, detail: 'Se puede restaurar' };
    }
    if (item.action === 'RESTORED') {
      return { title: `${who} restauró la cámara ${item.cameraName}`, detail: null };
    }
    return {
      title: `${who} cambió el sentido de ${item.cameraName}`,
      detail: `${DIRECTION_LABEL[item.from ?? 'AUTO']} → ${DIRECTION_LABEL[item.to ?? 'AUTO']}`,
    };
  }

  const changes = [
    item.previousPlate && item.previousPlate !== item.plate
      ? `placa ${item.previousPlate} → ${item.plate}`
      : null,
    item.previousDirection && item.previousDirection !== item.direction
      ? `${DIRECTION_LABEL[item.previousDirection]} → ${DIRECTION_LABEL[item.direction]}`
      : null,
  ].filter(Boolean);

  return {
    title: `${who} corrigió la lectura de ${item.plate}`,
    detail: [changes.join(' · '), item.note ? `"${item.note}"` : null].filter(Boolean).join(' — '),
  };
}

function ActivityIcon({ item }: { item: GateActivity }) {
  const color = palette.steel300;
  if (item.kind === 'read') return <PencilIcon size={16} color={color} />;
  if (item.action === 'REMOVED') return <TrashIcon size={16} color={color} />;
  if (item.action === 'RESTORED') return <RestoreIcon size={16} color={color} />;
  return <VideoIcon size={16} color={color} />;
}

type ActivityListProps = {
  activity: GateActivity[] | null;
  now: number;
  /** Cuántos mostrar (Inicio muestra menos que el monitor). */
  limit?: number;
};

export function ActivityList({ activity, now, limit = 6 }: ActivityListProps) {
  return (
    <View style={[plateCard, { gap: 2, paddingHorizontal: 16, paddingVertical: 12 }]}>
      <Text className="pb-1 text-base font-semibold text-steel-100">Cambios recientes</Text>
      {activity === null ? (
        <Text className="py-2 text-sm text-steel-500">Cargando…</Text>
      ) : activity.length === 0 ? (
        <Text className="py-2 text-sm leading-5 text-steel-500">
          Aquí aparece quién quita, restaura o cambia una cámara y quién corrige una lectura.
        </Text>
      ) : (
        activity.slice(0, limit).map((item, index) => {
          const { title, detail } = describe(item);
          return (
            <View
              key={item.id}
              className="flex-row items-start gap-3"
              style={[
                { paddingVertical: 10 },
                index > 0 ? { borderTopWidth: 1, borderTopColor: palette.ink700 } : null,
              ]}
            >
              <View className="mt-0.5">
                <ActivityIcon item={item} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-steel-100">{title}</Text>
                {detail ? (
                  <Text className="text-xs leading-4 text-steel-400" numberOfLines={2}>
                    {detail}
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-steel-500">
                {relativeTime(new Date(item.at).getTime(), now)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}
