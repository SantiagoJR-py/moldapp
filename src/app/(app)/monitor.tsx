import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityList, useGateActivity } from '@/components/gate/activity-list';
import { AlertCard } from '@/components/gate/alert-card';
import { CameraTile } from '@/components/gate/camera-tile';
import { ReadRow } from '@/components/plates/read-row';
import { plateCard } from '@/components/plates/styles';
import { usePlateFeed } from '@/components/plates/use-plate-feed';
import { Banner } from '@/components/ui/banner';
import {
  ChevronRightIcon,
  RestoreIcon,
  ScanIcon,
  UploadIcon,
  VideoIcon,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { GateOnly } from '@/components/gate-only';
import { motion, palette, radius } from '@/constants/theme';
import { useGateAlerts } from '@/context/gate-alerts';
import { apiMessage } from '@/lib/api-messages';
import { ApiError } from '@/lib/http';
import { useContentWidth, WIDE_CONTENT_WIDTH } from '@/lib/layout';
import { useNow } from '@/lib/use-now';
import { relativeTime } from '@/lib/time';
import { gateService, type CameraDirection, type GateCamera } from '@/services/gate.service';

/** El estado de las cámaras (en vivo, sin señal, última placa) cambia lento. */
const CAMERAS_POLL_MS = 5000;
/** A partir de este ancho de contenido, las alertas van en una columna al lado de las cámaras. */
const RAIL_MIN = 980;
const RAIL_WIDTH = 360;
const RECENT_ITEMS = 8;
const RAIL_ALERTS = 3;

const SETTLE = LinearTransition.duration(motion.base).springify().damping(22);

type CamerasState =
  | { phase: 'loading' }
  | { phase: 'ready'; cameras: GateCamera[] }
  | { phase: 'error'; message: string; offline: boolean };

export default function MonitorRoute() {
  return (
    <GateOnly>
      <MonitorScreen />
    </GateOnly>
  );
}

function MonitorScreen() {
  const insets = useSafeAreaInsets();
  const contentWidth = useContentWidth(WIDE_CONTENT_WIDTH);
  const withRail = contentWidth >= RAIL_MIN;
  const gridWidth = withRail ? contentWidth - RAIL_WIDTH - 20 : contentWidth;

  const now = useNow();
  const feed = usePlateFeed();
  const { pendingPlates } = useGateAlerts();
  const [state, setState] = useState<CamerasState>({ phase: 'loading' });
  const [focused, setFocused] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const activity = useGateActivity();
  // Cada consulta lleva un número: si mientras tanto alguien cambió una cámara, la respuesta
  // vieja se descarta y no "revive" por un momento lo que se acaba de quitar.
  const latestRequest = useRef(0);

  const fetchCameras = useCallback(async () => {
    const request = ++latestRequest.current;
    try {
      const cameras = await gateService.cameras();
      if (request === latestRequest.current) setState({ phase: 'ready', cameras });
    } catch (error) {
      if (request !== latestRequest.current) return;
      setState({
        phase: 'error',
        message: apiMessage(error, 'No pudimos traer las cámaras.'),
        offline: error instanceof ApiError && error.status === 503,
      });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      await fetchCameras();
      if (alive) timer = setTimeout(() => void tick(), CAMERAS_POLL_MS);
    }

    void tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [fetchCameras]);

  /** Corre un cambio de cámara; si falla, aquí se explica y la tarjeta vuelve a su estado. */
  async function change(action: () => Promise<void>, failure: string, success: string) {
    setNotice(null);
    try {
      await action();
    } catch (error) {
      setNotice({ tone: 'error', message: apiMessage(error, failure) });
      throw error;
    }
    setNotice({ tone: 'success', message: success });
    await fetchCameras();
  }

  function removeCamera(camera: GateCamera) {
    if (focused === camera.id) setFocused(null);
    return change(
      () => gateService.removeCamera(camera.id),
      'No pudimos quitar la cámara.',
      `Se quitó ${camera.name}: ya no lee placas. Quedó en Cámaras quitadas por si hay que restaurarla.`,
    );
  }

  function setDirection(camera: GateCamera, direction: CameraDirection) {
    const label =
      direction === 'ENTRY'
        ? 'de entrada: sus vehículos sin registrar alertan'
        : direction === 'EXIT'
          ? 'de salida: ya no alerta'
          : 'automática: el sistema decide si es entrada o salida';
    return change(
      () => gateService.setCameraDirection(camera.id, direction),
      'No pudimos cambiar el sentido de la cámara.',
      `${camera.name} ahora es ${label}.`,
    );
  }

  function restoreCamera(camera: GateCamera) {
    return change(
      () => gateService.restoreCamera(camera.id),
      'No pudimos restaurar la cámara.',
      `Se restauró ${camera.name}: vuelve a leer placas.`,
    );
  }

  const all = state.phase === 'ready' ? state.cameras : [];
  const cameras = all.filter((camera) => camera.status !== 'removed');
  const removed = all.filter((camera) => camera.status === 'removed');
  const shown = focused ? cameras.filter((camera) => camera.id === focused) : cameras;
  // Dos cámaras por fila cuando hay espacio; una sola cámara (o la enfocada) ocupa todo.
  const columns = shown.length > 1 && gridWidth >= 640 ? 2 : 1;
  const tileWidth = (gridWidth - (columns - 1) * 16) / columns;
  const liveCount = cameras.filter((camera) => camera.status === 'live').length;

  const grid = (
    <View style={{ width: gridWidth, gap: 16 }}>
      {state.phase === 'loading' ? <TileSkeleton /> : null}

      {notice ? <Banner tone={notice.tone} message={notice.message} /> : null}

      {state.phase === 'error' ? (
        <View style={{ gap: 12 }}>
          <Banner tone="error" message={state.message} />
          {state.offline ? (
            <Text className="text-sm leading-5 text-steel-400">
              Las cámaras fijas las maneja el servicio de visión de este PC. Mientras se enciende,
              puedes usar la cámara de este equipo.
            </Text>
          ) : null}
        </View>
      ) : null}

      {state.phase === 'ready' && cameras.length === 0 ? (
        <NoCameras hasRemoved={removed.length > 0} />
      ) : null}

      {focused ? (
        <PressableScale
          accessibilityLabel="Ver todas las cámaras"
          depth={0.97}
          onPress={() => setFocused(null)}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 4,
          }}
        >
          <VideoIcon size={16} color={palette.accent400} />
          <Text className="text-sm font-medium text-accent-400">Ver todas las cámaras</Text>
        </PressableScale>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {shown.map((camera, index) => (
          <Animated.View
            key={camera.id}
            entering={FadeInDown.duration(motion.base)
              .delay(index * 60)
              .springify()
              .damping(20)}
            layout={SETTLE}
            style={{ width: tileWidth }}
          >
            <CameraTile
              camera={camera}
              alerted={pendingPlates}
              now={now}
              onPress={
                cameras.length > 1 ? () => setFocused(focused ? null : camera.id) : undefined
              }
              onRemove={() => removeCamera(camera)}
              onDirection={(direction) => setDirection(camera, direction)}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const recent = (
    <View style={[plateCard, { gap: 6, padding: 16 }]}>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-steel-100">Últimos pasos</Text>
        <PressableScale
          accessibilityLabel="Ver todas las entradas y salidas"
          depth={0.95}
          onPress={() => router.navigate('/access-log')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 }}
        >
          <Text className="text-sm text-accent-400">Ver todo</Text>
          <ChevronRightIcon size={15} color={palette.accent400} />
        </PressableScale>
      </View>
      {feed.reads.length === 0 ? (
        <Text className="text-sm leading-5 text-steel-500">
          {feed.status === 'live'
            ? 'Aún no pasa ningún vehículo hoy.'
            : 'Conectando con el historial…'}
        </Text>
      ) : (
        feed.reads.slice(0, RECENT_ITEMS).map((read) => (
          <Animated.View key={read.id} entering={FadeInDown.duration(motion.base)} layout={SETTLE}>
            <ReadRow read={read} />
          </Animated.View>
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
      <Animated.View
        entering={FadeInDown.duration(motion.slow).springify().damping(20)}
        style={{
          flexDirection: withRail ? 'row' : 'column',
          alignItems: withRail ? 'flex-end' : 'stretch',
          gap: 14,
        }}
      >
        <View style={{ flex: withRail ? 1 : undefined, gap: 6 }}>
          <Text className="text-3xl font-bold tracking-tight text-steel-100">En vivo</Text>
          <Text className="text-sm text-steel-400">
            {state.phase === 'ready' && cameras.length > 0
              ? `${liveCount} de ${cameras.length} ${cameras.length === 1 ? 'cámara transmitiendo' : 'cámaras transmitiendo'} · las placas se leen solas`
              : 'Cámaras de portería con lectura de placas'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <QuickAction
            label={withRail ? 'Cámara de este equipo' : 'Mi cámara'}
            icon="scan"
            grow={!withRail}
            onPress={() => router.push({ pathname: '/detection', params: { mode: 'camera' } })}
          />
          <QuickAction
            label={withRail ? 'Analizar archivo' : 'Subir archivo'}
            icon="upload"
            grow={!withRail}
            onPress={() => router.push({ pathname: '/detection', params: { mode: 'file' } })}
          />
        </View>
      </Animated.View>

      {withRail ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20 }}>
          <View style={{ width: gridWidth, gap: 20 }}>
            {grid}
            {removed.length > 0 ? (
              <RemovedCameras cameras={removed} now={now} onRestore={restoreCamera} />
            ) : null}
            <ActivityList activity={activity} now={now} limit={8} />
          </View>
          <View style={{ width: RAIL_WIDTH, gap: 16 }}>
            <PendingRail now={now} />
            {recent}
          </View>
        </View>
      ) : (
        <>
          {grid}
          {recent}
          {removed.length > 0 ? (
            <RemovedCameras cameras={removed} now={now} onRestore={restoreCamera} />
          ) : null}
          <ActivityList activity={activity} now={now} />
        </>
      )}
    </ScrollView>
  );
}

type QuickActionProps = {
  label: string;
  icon: 'scan' | 'upload';
  /** En el celular los dos botones se reparten el ancho. */
  grow: boolean;
  onPress: () => void;
};

function QuickAction({ label, icon, grow, onPress }: QuickActionProps) {
  const Icon = icon === 'scan' ? ScanIcon : UploadIcon;

  return (
    <View style={grow ? { flex: 1 } : { flexShrink: 1 }}>
      <PressableScale
        accessibilityLabel={label}
        depth={0.96}
        onPress={onPress}
        style={{
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderRadius: radius.field,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: palette.ink600,
          backgroundColor: palette.ink800,
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Icon size={18} color={palette.accent400} />
        <Text className="text-sm font-medium text-steel-100" numberOfLines={1}>
          {label}
        </Text>
      </PressableScale>
    </View>
  );
}

/** En el PC, lo que hay que resolver queda al lado de las cámaras, sin cambiar de pantalla. */
function PendingRail({ now }: { now: number }) {
  const { pending } = useGateAlerts();

  if (pending.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(motion.base)}
        style={[plateCard, { gap: 4, padding: 16, borderColor: 'rgba(52, 211, 153, 0.35)' }]}
      >
        <Text className="text-base font-semibold text-steel-100">Sin pendientes</Text>
        <Text className="text-sm leading-5 text-steel-400">
          Todos los vehículos que entraron están inscritos.
        </Text>
      </Animated.View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-state-danger">
          Por resolver · {pending.length}
        </Text>
        {pending.length > RAIL_ALERTS ? (
          <PressableScale
            accessibilityLabel="Ver todas las alertas"
            depth={0.95}
            onPress={() => router.navigate('/alerts')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 }}
          >
            <Text className="text-sm text-accent-400">Ver todas</Text>
            <ChevronRightIcon size={15} color={palette.accent400} />
          </PressableScale>
        ) : null}
      </View>
      {pending.slice(0, RAIL_ALERTS).map((alert) => (
        <Animated.View
          key={alert.id}
          entering={FadeInDown.duration(motion.base).springify().damping(20)}
          exiting={FadeOut.duration(motion.fast)}
          layout={SETTLE}
        >
          <AlertCard alert={alert} now={now} />
        </Animated.View>
      ))}
    </View>
  );
}

function NoCameras({ hasRemoved }: { hasRemoved: boolean }) {
  return (
    <View style={[plateCard, { gap: 10, padding: 20 }]}>
      <VideoIcon size={28} color={palette.steel500} />
      <Text className="text-base font-semibold text-steel-100">
        {hasRemoved ? 'Todas las cámaras están quitadas' : 'No hay cámaras fijas configuradas'}
      </Text>
      <Text className="text-sm leading-5 text-steel-400">
        {hasRemoved
          ? 'Restaura una abajo, en Cámaras quitadas, para volver a leer placas. Mientras tanto, usa la cámara de este equipo.'
          : 'Agrégalas en el archivo camaras.json del servicio de visión (canal RTSP del DVR o capturadora USB) y reinícialo. Mientras tanto, usa la cámara de este equipo.'}
      </Text>
    </View>
  );
}

/** Las quitadas con soft delete: quién las quitó, cuándo y el botón para restaurarlas. */
function RemovedCameras({
  cameras,
  now,
  onRestore,
}: {
  cameras: GateCamera[];
  now: number;
  onRestore: (camera: GateCamera) => Promise<void>;
}) {
  return (
    <View style={[plateCard, { gap: 2, paddingHorizontal: 16, paddingVertical: 12 }]}>
      <Text className="pb-1 text-base font-semibold text-steel-100">Cámaras quitadas</Text>
      {cameras.map((camera, index) => (
        <View
          key={camera.id}
          className="flex-row items-center gap-3"
          style={[
            { paddingVertical: 10 },
            index > 0 ? { borderTopWidth: 1, borderTopColor: palette.ink700 } : null,
          ]}
        >
          <VideoIcon size={18} color={palette.steel500} />
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-medium text-steel-200" numberOfLines={1}>
              {camera.name}
            </Text>
            <Text className="text-xs text-steel-500" numberOfLines={1}>
              Quitada{camera.removedBy ? ` por ${camera.removedBy}` : ''}
              {camera.removedAt
                ? ` · ${relativeTime(new Date(camera.removedAt).getTime(), now)}`
                : ''}
            </Text>
          </View>
          <RestoreButton camera={camera} onRestore={onRestore} />
        </View>
      ))}
    </View>
  );
}

function RestoreButton({
  camera,
  onRestore,
}: {
  camera: GateCamera;
  onRestore: (camera: GateCamera) => Promise<void>;
}) {
  const [restoring, setRestoring] = useState(false);

  return (
    <PressableScale
      accessibilityLabel={`Restaurar la cámara ${camera.name}`}
      depth={0.95}
      disabled={restoring}
      onPress={() => {
        setRestoring(true);
        // Si sale bien la fila desaparece; si falla, el monitor explica y se puede reintentar.
        onRestore(camera).catch(() => setRestoring(false));
      }}
      style={{
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: radius.field,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.ink600,
        backgroundColor: palette.ink800,
        paddingHorizontal: 12,
      }}
    >
      {restoring ? (
        <ActivityIndicator size="small" color={palette.accent400} />
      ) : (
        <RestoreIcon size={16} color={palette.accent400} />
      )}
      <Text className="text-sm font-medium text-steel-100">Restaurar</Text>
    </PressableScale>
  );
}

function TileSkeleton() {
  return (
    <View
      style={{
        aspectRatio: 16 / 9,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: radius.card,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.ink700,
        backgroundColor: palette.ink900,
      }}
    >
      <VideoIcon size={26} color={palette.steel600} />
      <Text className="text-sm text-steel-500">Conectando con las cámaras…</Text>
    </View>
  );
}
