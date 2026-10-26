import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { tabular } from '@/components/plates/styles';
import { EntryIcon, ExitIcon, SlidersIcon, VideoIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { palette, radius, shadows } from '@/constants/theme';
import { relativeTime } from '@/lib/time';
import type { CameraDirection, GateCamera } from '@/services/gate.service';
import { CameraFeed } from './camera-feed';
import { CameraSettings } from './camera-settings';
import { DetectionOverlay } from './detection-overlay';
import { useCameraDetections } from './use-camera-detections';

type CameraTileProps = {
  camera: GateCamera;
  alerted: ReadonlySet<string>;
  now: number;
  /** Fuera de pantalla no se pide video. */
  active?: boolean;
  onPress?: () => void;
  /** Ajustes de portería: sin ellos la tarjeta solo muestra el video. */
  onRemove?: () => Promise<void>;
  onDirection?: (direction: CameraDirection) => Promise<void>;
};

const SCRIM = ['rgba(8, 12, 18, 0.88)', 'rgba(8, 12, 18, 0)'] as const;

/** Una cámara de portería: el video, los recuadros de las placas y su estado, sin salir de la imagen. */
export function CameraTile({
  camera,
  alerted,
  now,
  active = true,
  onPress,
  onRemove,
  onDirection,
}: CameraTileProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const live = camera.status === 'live';
  const configurable = Boolean(onRemove && onDirection);
  const boxes = useCameraDetections(camera.id, active && live);
  const ratio =
    camera.frameWidth && camera.frameHeight ? camera.frameWidth / camera.frameHeight : 16 / 9;
  const DirectionIcon = camera.direction === 'EXIT' ? ExitIcon : EntryIcon;

  const body = (
    <View
      style={{
        aspectRatio: ratio,
        overflow: 'hidden',
        borderRadius: radius.card,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.ink700,
        backgroundColor: '#03070C',
        boxShadow: shadows.raised,
      }}
    >
      {live ? <CameraFeed camera={camera} active={active} /> : null}
      {live ? <DetectionOverlay boxes={boxes} alerted={alerted} /> : null}
      {live ? null : <Unavailable camera={camera} />}

      <LinearGradient
        colors={SCRIM}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 12,
          right: configurable ? 48 : 12,
          top: 8,
          minHeight: 32,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <LiveDot live={live} />
        <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>
          {camera.name}
        </Text>
        {camera.direction ? (
          <View
            className="flex-row items-center gap-1 rounded-pill px-2 py-0.5"
            style={{ backgroundColor: 'rgba(8, 12, 18, 0.66)' }}
          >
            <DirectionIcon size={13} color={palette.steel200} />
            <Text className="text-[11px] font-medium text-steel-200">
              {camera.direction === 'EXIT' ? 'Salida' : 'Entrada'}
            </Text>
          </View>
        ) : null}
        {camera.test ? (
          <View
            className="rounded-pill px-2 py-0.5"
            style={{ backgroundColor: 'rgba(61, 143, 245, 0.28)' }}
          >
            <Text className="text-[11px] font-medium text-accent-200">Prueba</Text>
          </View>
        ) : null}
      </View>

      {camera.lastPlate && live ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(8, 12, 18, 0.72)',
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text className="text-[11px] text-steel-300">Última</Text>
          <Text
            className="text-xs font-bold text-steel-100"
            style={[tabular, { letterSpacing: 1 }]}
          >
            {camera.lastPlate.plate}
          </Text>
          <Text className="text-[11px] text-steel-400">
            {relativeTime(new Date(camera.lastPlate.at).getTime(), now)}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const tile = onPress ? (
    <PressableScale
      accessibilityLabel={`Ver ${camera.name} en grande`}
      depth={0.985}
      haptic={false}
      onPress={onPress}
    >
      {body}
    </PressableScale>
  ) : (
    body
  );

  // Los ajustes van encima de la tarjeta, no dentro: la tarjeta ya es un botón (ver en grande) y
  // un botón no puede llevar otro adentro.
  return (
    <View>
      {tile}
      {configurable && !settingsOpen ? (
        <View style={{ position: 'absolute', top: 8, right: 8 }}>
          <PressableScale
            accessibilityLabel={`Ajustes de la cámara ${camera.name}`}
            depth={0.88}
            onPress={() => setSettingsOpen(true)}
            style={{
              height: 32,
              width: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              backgroundColor: 'rgba(8, 12, 18, 0.72)',
            }}
          >
            <SlidersIcon size={16} color={palette.steel100} />
          </PressableScale>
        </View>
      ) : null}
      {settingsOpen && onRemove && onDirection ? (
        <CameraSettings
          camera={camera}
          onDirection={onDirection}
          onRemove={onRemove}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </View>
  );
}

function LiveDot({ live }: { live: boolean }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!live || reduceMotion) {
      pulse.set(1);
      return;
    }
    pulse.set(withRepeat(withTiming(0.35, { duration: 900 }), -1, true));
  }, [live, reduceMotion, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        {
          height: 8,
          width: 8,
          borderRadius: radius.pill,
          backgroundColor: live ? palette.danger : palette.steel500,
        },
        style,
      ]}
    />
  );
}

function Unavailable({ camera }: { camera: GateCamera }) {
  const connecting = camera.status === 'connecting';

  return (
    <View className="flex-1 items-center justify-center gap-2.5 px-6">
      {connecting ? (
        <ActivityIndicator color={palette.accent400} />
      ) : (
        <VideoIcon size={28} color={palette.steel500} />
      )}
      <Text className="text-center text-sm font-semibold text-steel-200">
        {connecting
          ? 'Conectando con la cámara…'
          : camera.status === 'ended'
            ? 'El video terminó'
            : 'Sin señal'}
      </Text>
      {camera.error && !connecting ? (
        <Text className="text-center text-xs leading-4 text-steel-500">
          {camera.error}. Se reintenta solo cada pocos segundos.
        </Text>
      ) : null}
    </View>
  );
}
