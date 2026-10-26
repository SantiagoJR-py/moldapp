import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LiveStatus } from '@/components/plates/live-status';
import { ReadCard } from '@/components/plates/read-card';
import { plateCard, tabular } from '@/components/plates/styles';
import { usePlateFeed } from '@/components/plates/use-plate-feed';
import { Banner } from '@/components/ui/banner';
import { CameraIcon } from '@/components/ui/icons';
import { Segmented } from '@/components/ui/segmented';
import { GateOnly } from '@/components/gate-only';
import { palette, radius } from '@/constants/theme';
import { relativeTime } from '@/lib/time';
import type { PlateRead, PlateReadSummary } from '@/services/plate-read.service';
import { appear, settle } from '@/lib/motion';

/** Una cámara sin lecturas en este lapso se muestra como inactiva. */
const CAMERA_IDLE_MS = 5 * 60 * 1000;

/** El menú fijo ocupa este ancho en pantallas grandes (ver `app-shell.tsx`). */
const SIDE_MENU_WIDTH = 288;

const PERMANENT_MENU_BREAKPOINT = 1024;

const MAX_CONTENT_WIDTH = 860;

/** A partir de este ancho de contenido el resumen pasa a una columna lateral. */
const TWO_COLUMN_MIN = 720;

type Filter = 'all' | 'entries' | 'exits' | 'unregistered';

/** Sin registrar y sin resolver todavía: lo que portería tiene que atender. */
function awaitingRegistration(read: PlateRead): boolean {
  return (
    !read.vehicle && read.alert?.status !== 'REGISTERED' && read.alert?.status !== 'ALLOWED_VISIT'
  );
}

const FILTERS: Record<Filter, (read: PlateRead) => boolean> = {
  all: () => true,
  entries: (read) => read.direction === 'ENTRY',
  exits: (read) => read.direction === 'EXIT',
  unregistered: (read) => !read.vehicle,
};

function openRegistration(read: PlateRead) {
  router.push({
    pathname: '/gate-register',
    params: {
      plate: read.licensePlateNumber,
      ...(read.alert?.status === 'PENDING' ? { alertId: String(read.alert.id) } : {}),
    },
  });
}

export default function AccessLogRoute() {
  return (
    <GateOnly>
      <AccessLogScreen />
    </GateOnly>
  );
}

function AccessLogScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth =
    Math.min(
      width - (width >= PERMANENT_MENU_BREAKPOINT ? SIDE_MENU_WIDTH : 0),
      MAX_CONTENT_WIDTH,
    ) - 40;
  const wide = contentWidth >= TWO_COLUMN_MIN;

  const { reads, summary, status, error, now, replaceRead } = usePlateFeed();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = reads.filter(FILTERS[filter]);
  const groups = groupByDay(visible, now);
  const awaiting = new Set(
    reads.filter(awaitingRegistration).map((read) => read.licensePlateNumber),
  ).size;
  const cameras = camerasFrom(reads);

  const feed = (
    <View style={{ flex: 1, gap: 20 }}>
      {status === 'loading' ? (
        <View style={{ gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : reads.length === 0 ? (
        // Sin conexión no se sabe si hay lecturas: el aviso de error ya lo explica.
        status === 'live' ? (
          <EmptyState />
        ) : null
      ) : visible.length === 0 ? (
        <Text className="py-6 text-center text-sm text-steel-400">
          No hay lecturas recientes con este filtro.
        </Text>
      ) : (
        groups.map((group) => (
          <View key={group.label} style={{ gap: 12 }}>
            <Text className="text-sm font-semibold text-steel-300">{group.label}</Text>
            {group.reads.map((read, index) => (
              <Animated.View key={read.id} entering={appear} layout={settle}>
                <ReadCard
                  read={read}
                  now={now}
                  onRegister={() => openRegistration(read)}
                  onCorrected={replaceRead}
                />
              </Animated.View>
            ))}
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Animated.View entering={appear} style={{ gap: 8 }}>
        <Text className="text-3xl font-bold tracking-tight text-steel-100">Entradas y salidas</Text>
        <LiveStatus status={status} />
      </Animated.View>

      {status === 'forbidden' ? null : (
        <Segmented
          accessibilityLabel="Filtrar lecturas"
          value={filter}
          onChange={setFilter}
          segments={[
            { value: 'all', label: 'Todas' },
            { value: 'entries', label: 'Entradas' },
            { value: 'exits', label: 'Salidas' },
            // En el celular no cabe "Sin registrar" con su número: son los vehículos nuevos.
            {
              value: 'unregistered',
              label: contentWidth >= 520 ? 'Sin registrar' : 'Nuevos',
              count: awaiting,
            },
          ]}
        />
      )}

      {error ? <Banner tone="error" message={error} /> : null}

      {status === 'forbidden' ? null : wide ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20 }}>
          {feed}
          <View style={{ width: 248, gap: 16 }}>
            <SummaryPanel summary={summary} vertical />
            <CameraPanel cameras={cameras} now={now} />
          </View>
        </View>
      ) : (
        <>
          <SummaryPanel summary={summary} />
          {feed}
        </>
      )}
    </ScrollView>
  );
}

function SummaryPanel({
  summary,
  vertical = false,
}: {
  summary: PlateReadSummary | null;
  vertical?: boolean;
}) {
  const items = [
    { label: 'Adentro ahora', value: summary?.inside, alert: false },
    { label: 'Entradas hoy', value: summary?.entriesToday, alert: false },
    { label: 'Sin registrar hoy', value: summary?.unregisteredToday, alert: true },
  ];
  // Es un conteo, no algo por resolver: va en ámbar y el rojo queda para las alertas pendientes.

  return (
    <View style={[plateCard, { flexDirection: vertical ? 'column' : 'row', overflow: 'hidden' }]}>
      {items.map((item, index) => {
        const highlighted = item.alert && (item.value ?? 0) > 0;
        return (
          <View
            key={item.label}
            style={{
              flex: vertical ? undefined : 1,
              gap: 2,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderColor: palette.hairline,
              ...(vertical && index > 0 ? { borderTopWidth: 1 } : null),
            }}
          >
            <Text
              className="text-2xl font-bold"
              style={[tabular, { color: highlighted ? palette.warning : palette.steel100 }]}
            >
              {item.value ?? '–'}
            </Text>
            <Text className="text-xs text-steel-300" numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CameraPanel({ cameras, now }: { cameras: CameraInfo[]; now: number }) {
  return (
    <View style={[plateCard, { gap: 14, padding: 16 }]}>
      <Text className="text-sm font-semibold text-steel-200">Cámaras</Text>
      {cameras.length === 0 ? (
        <Text className="text-sm leading-5 text-steel-400">
          Aparecen aquí cuando envían su primera lectura.
        </Text>
      ) : (
        cameras.map((camera) => {
          const active = now - camera.lastSeen < CAMERA_IDLE_MS;
          return (
            <View key={camera.name} className="flex-row items-center gap-3">
              <View
                style={{
                  height: 8,
                  width: 8,
                  borderRadius: radius.pill,
                  backgroundColor: active ? palette.success : palette.steel600,
                }}
              />
              <View className="flex-1">
                <Text className="text-sm text-steel-100" numberOfLines={1}>
                  {camera.name}
                </Text>
                <Text className="text-xs text-steel-400">
                  {active ? 'Última lectura ' : 'Inactiva · '}
                  {relativeTime(camera.lastSeen, now)}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function SkeletonCard() {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) pulse.set(withRepeat(withTiming(0.5, { duration: 800 }), -1, true));
  }, [reduceMotion, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const block = { borderRadius: 6, backgroundColor: palette.ink700 } as const;

  return (
    <Animated.View style={[plateCard, { gap: 14, padding: 16 }, style]}>
      <View className="flex-row items-center justify-between">
        <View style={[block, { height: 30, width: 112 }]} />
        <View style={[block, { height: 18, width: 48 }]} />
      </View>
      <View className="flex-row items-center gap-3">
        <View style={[block, { height: 44, width: 88 }]} />
        <View className="flex-1 gap-2">
          <View style={[block, { height: 14, width: '60%' }]} />
          <View style={[block, { height: 12, width: '40%' }]} />
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <Animated.View
      entering={appear}
      style={[
        plateCard,
        { alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 40 },
      ]}
    >
      <CameraIcon size={32} color={palette.steel500} />
      <Text className="text-center text-base font-semibold text-steel-200">
        Todavía no hay lecturas de placas
      </Text>
      <Text className="text-center text-sm leading-5 text-steel-300">
        Cuando una cámara de portería lea una placa, aparece aquí al instante con su foto, el
        sentido y a quién pertenece.
      </Text>
    </Animated.View>
  );
}

type CameraInfo = { name: string; lastSeen: number };

function camerasFrom(reads: PlateRead[]): CameraInfo[] {
  const byName = new Map<string, number>();
  for (const read of reads) {
    const seen = new Date(read.seenAt).getTime();
    byName.set(read.cameraName, Math.max(byName.get(read.cameraName) ?? 0, seen));
  }
  return [...byName]
    .map(([name, lastSeen]) => ({ name, lastSeen }))
    .sort((a, b) => b.lastSeen - a.lastSeen);
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function groupByDay(reads: PlateRead[], now: number): { label: string; reads: PlateRead[] }[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const groups: { label: string; reads: PlateRead[] }[] = [];

  for (const read of reads) {
    const day = new Date(read.seenAt);
    day.setHours(0, 0, 0, 0);
    const daysAgo = Math.round((today.getTime() - day.getTime()) / 86400000);
    const label =
      daysAgo === 0
        ? 'Hoy'
        : daysAgo === 1
          ? 'Ayer'
          : `${capitalize(WEEKDAYS[day.getDay()])} ${day.getDate()} de ${MONTHS[day.getMonth()]}`;

    const last = groups[groups.length - 1];
    if (last?.label === label) last.reads.push(read);
    else groups.push({ label, reads: [read] });
  }
  return groups;
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}
