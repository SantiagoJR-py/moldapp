import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PlateChip } from '@/components/plates/plate-chip';
import { ReadRow } from '@/components/plates/read-row';
import { plateCard, tabular } from '@/components/plates/styles';
import { usePlateFeed } from '@/components/plates/use-plate-feed';
import {
  AlertIcon,
  CarIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ScanIcon,
  ShieldIcon,
  VideoIcon,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { motion, palette, radius } from '@/constants/theme';
import { isColombianPlate } from '@/constants/vehicle';
import { useGateAlerts } from '@/context/gate-alerts';
import { useContentWidth } from '@/lib/layout';
import { relativeTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { gateService, type GateCamera } from '@/services/gate.service';
import { ActivityList, useGateActivity } from './activity-list';

/** El estado de las cámaras cambia lento; en Inicio basta con revisarlo cada tanto. */
const CAMERAS_POLL_MS = 10000;
const RECENT_ITEMS = 5;
/** Desde este ancho de contenido, Inicio va en dos columnas. */
const TWO_COLUMN_MIN = 720;

function enter(index: number) {
  return FadeInDown.duration(motion.slow)
    .delay(index * 60)
    .springify()
    .damping(20);
}

/**
 * Inicio de Portería: lo que hay que mirar al llegar al turno. Primero lo que falta resolver,
 * después cómo están las cámaras, qué cambió y los últimos pasos.
 */
export function GateHome() {
  const now = useNow();
  const wide = useContentWidth() >= TWO_COLUMN_MIN;
  const feed = usePlateFeed();
  const activity = useGateActivity();
  const cameras = useCameraStatus();

  const left = (
    <View style={{ flex: 1, gap: 16 }}>
      <Animated.View entering={enter(1)}>
        <PendingCallout />
      </Animated.View>
      <Animated.View entering={enter(2)}>
        <Today feed={feed} />
      </Animated.View>
      <Animated.View entering={enter(3)}>
        <CamerasCard cameras={cameras} now={now} />
      </Animated.View>
    </View>
  );

  const right = (
    <View style={{ flex: 1, gap: 16 }}>
      <Animated.View entering={enter(4)}>
        <Shortcuts />
      </Animated.View>
      <Animated.View entering={enter(5)}>
        <ActivityList activity={activity} now={now} limit={5} />
      </Animated.View>
      <Animated.View entering={enter(6)}>
        <View style={[plateCard, { gap: 4, padding: 16 }]}>
          <SectionLink title="Últimos pasos" label="Ver todo" href="/access-log" />
          {feed.reads.length === 0 ? (
            <Text className="py-1 text-sm text-steel-500">
              {feed.status === 'live' ? 'Aún no pasa ningún vehículo.' : 'Conectando…'}
            </Text>
          ) : (
            feed.reads.slice(0, RECENT_ITEMS).map((read) => <ReadRow key={read.id} read={read} />)
          )}
        </View>
      </Animated.View>
    </View>
  );

  return wide ? (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      {left}
      {right}
    </View>
  ) : (
    <View style={{ gap: 16 }}>
      {left}
      {right}
    </View>
  );
}

function useCameraStatus(): GateCamera[] | null {
  const [cameras, setCameras] = useState<GateCamera[] | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const next = await gateService.cameras();
        if (alive) setCameras(next);
      } catch {
        // Servicio de visión apagado: se muestra como "sin datos" en la tarjeta.
        if (alive) setCameras([]);
      }
      if (alive) timer = setTimeout(() => void tick(), CAMERAS_POLL_MS);
    }

    void tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return cameras;
}

/** Lo urgente primero: vehículos sin registrar esperando, o la confirmación de que no hay. */
function PendingCallout() {
  const { pending } = useGateAlerts();
  const count = pending.length;

  if (count === 0) {
    return (
      <View
        style={[
          plateCard,
          { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
          { borderColor: 'rgba(52, 211, 153, 0.35)' },
        ]}
      >
        <ShieldIcon size={26} color={palette.success} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-steel-100">Todo en orden</Text>
          <Text className="text-sm text-steel-400">No hay vehículos sin registrar esperando.</Text>
        </View>
      </View>
    );
  }

  const latest = pending[0];

  return (
    <PressableScale
      accessibilityLabel={`${count} vehículos sin registrar. Resolver`}
      depth={0.98}
      onPress={() => router.navigate('/alerts')}
      style={[
        plateCard,
        { gap: 12, padding: 16 },
        { borderColor: 'rgba(251, 113, 133, 0.5)', backgroundColor: 'rgba(251, 113, 133, 0.08)' },
      ]}
    >
      <View className="flex-row items-center gap-3">
        <AlertIcon size={22} color={palette.danger} />
        <Text className="flex-1 text-base font-semibold text-state-danger">
          {count === 1 ? '1 vehículo sin registrar' : `${count} vehículos sin registrar`}
        </Text>
        <ChevronRightIcon size={18} color={palette.steel300} />
      </View>
      <View className="flex-row items-center gap-3">
        <PlateChip
          plate={latest.licensePlateNumber}
          colombian={isColombianPlate(latest.licensePlateNumber)}
        />
        <Text className="flex-1 text-sm text-steel-300" numberOfLines={2}>
          El último entró por {latest.cameraName}. Inscríbelos con la tarjeta de propiedad o déjalos
          pasar como visita.
        </Text>
      </View>
    </PressableScale>
  );
}

function Today({ feed }: { feed: ReturnType<typeof usePlateFeed> }) {
  const items = [
    { label: 'Adentro ahora', value: feed.summary?.inside },
    { label: 'Entradas hoy', value: feed.summary?.entriesToday },
    { label: 'Sin registrar hoy', value: feed.summary?.unregisteredToday, alert: true },
  ];

  return (
    <View style={[plateCard, { flexDirection: 'row', overflow: 'hidden' }]}>
      {items.map((item, index) => {
        const highlighted = item.alert && (item.value ?? 0) > 0;
        return (
          <View
            key={item.label}
            style={{
              flex: 1,
              gap: 2,
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderColor: palette.ink700,
              ...(index > 0 ? { borderLeftWidth: 1 } : null),
            }}
          >
            <Text
              className="text-2xl font-bold"
              style={[tabular, { color: highlighted ? palette.danger : palette.steel100 }]}
            >
              {item.value ?? '–'}
            </Text>
            <Text className="text-xs text-steel-400" numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const STATUS_LABEL: Record<GateCamera['status'], { text: string; color: string }> = {
  live: { text: 'En vivo', color: palette.success },
  connecting: { text: 'Conectando', color: palette.warning },
  offline: { text: 'Sin señal', color: palette.danger },
  ended: { text: 'Video terminado', color: palette.steel500 },
  removed: { text: 'Quitada', color: palette.steel600 },
};

function CamerasCard({ cameras, now }: { cameras: GateCamera[] | null; now: number }) {
  const active = cameras?.filter((camera) => camera.status !== 'removed') ?? [];
  const live = active.filter((camera) => camera.status === 'live').length;

  return (
    <View style={[plateCard, { gap: 4, padding: 16 }]}>
      <SectionLink title="Cámaras" label="Ver en vivo" href="/monitor" />
      <Text className="pb-1 text-sm text-steel-400">
        {cameras === null
          ? 'Revisando…'
          : cameras.length === 0
            ? 'Sin cámaras fijas o el servicio de visión está apagado.'
            : `${live} de ${active.length} transmitiendo`}
      </Text>
      {(cameras ?? []).map((camera) => {
        const status = STATUS_LABEL[camera.status];
        return (
          <View
            key={camera.id}
            className="flex-row items-center gap-3"
            style={{ paddingVertical: 7 }}
          >
            <View
              style={{
                height: 8,
                width: 8,
                borderRadius: radius.pill,
                backgroundColor: status.color,
              }}
            />
            <View className="flex-1">
              <Text
                className="text-sm text-steel-100"
                style={camera.status === 'removed' ? { color: palette.steel500 } : null}
                numberOfLines={1}
              >
                {camera.name}
              </Text>
              <Text className="text-xs text-steel-500" numberOfLines={1}>
                {status.text}
                {camera.status === 'removed'
                  ? camera.removedBy
                    ? ` por ${camera.removedBy}`
                    : ''
                  : ` · ${camera.direction === 'ENTRY' ? 'Entrada' : camera.direction === 'EXIT' ? 'Salida' : 'Automático'}`}
                {camera.lastPlate && camera.status !== 'removed'
                  ? ` · última ${relativeTime(new Date(camera.lastPlate.at).getTime(), now)}`
                  : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Shortcuts() {
  const items: { label: string; icon: typeof VideoIcon; href: Href }[] = [
    { label: 'Cámaras en vivo', icon: VideoIcon, href: '/monitor' },
    { label: 'Detección manual', icon: ScanIcon, href: '/detection' },
    { label: 'Entradas y salidas', icon: ClipboardIcon, href: '/access-log' },
    { label: 'Mis vehículos', icon: CarIcon, href: '/vehicles' },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map(({ label, icon: Icon, href }) => (
        <View key={label} style={{ flexGrow: 1, flexBasis: '45%' }}>
          <PressableScale
            accessibilityLabel={label}
            depth={0.97}
            onPress={() => router.navigate(href)}
            style={{
              minHeight: 52,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderRadius: radius.field,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: palette.ink700,
              backgroundColor: palette.ink900,
              paddingHorizontal: 14,
            }}
          >
            <Icon size={19} color={palette.accent400} />
            <Text className="flex-1 text-sm font-medium text-steel-100" numberOfLines={1}>
              {label}
            </Text>
          </PressableScale>
        </View>
      ))}
    </View>
  );
}

function SectionLink({ title, label, href }: { title: string; label: string; href: Href }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base font-semibold text-steel-100">{title}</Text>
      <PressableScale
        accessibilityLabel={label}
        depth={0.95}
        onPress={() => router.navigate(href)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 }}
      >
        <Text className="text-sm text-accent-400">{label}</Text>
        <ChevronRightIcon size={15} color={palette.accent400} />
      </PressableScale>
    </View>
  );
}
