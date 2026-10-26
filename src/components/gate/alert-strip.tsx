import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PlateChip } from '@/components/plates/plate-chip';
import { ChevronRightIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { motion, palette, radius } from '@/constants/theme';
import { useGateAlerts } from '@/context/gate-alerts';
import { isColombianPlate } from '@/constants/vehicle';

/** Pantallas donde la franja sobra: ya muestran las alertas o están resolviendo una. */
const HIDDEN_ON = ['/alerts', '/gate-register'];

/**
 * Franja fija mientras haya vehículos sin registrar. No se puede cerrar: desaparece sola
 * cuando portería los resuelve todos.
 */
export function AlertStrip() {
  const pathname = usePathname();
  const { enabled, pending, incoming } = useGateAlerts();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  const visible = enabled && pending.length > 0 && !incoming && !HIDDEN_ON.includes(pathname);

  useEffect(() => {
    if (!visible || reduceMotion) {
      pulse.set(1);
      return;
    }
    pulse.set(withRepeat(withTiming(0.3, { duration: 850 }), -1, true));
  }, [visible, reduceMotion, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  if (!visible) return null;

  const latest = pending[0];
  const count = pending.length;

  return (
    <Animated.View
      entering={FadeInUp.duration(motion.base)}
      exiting={FadeOutUp.duration(motion.fast)}
    >
      <PressableScale
        accessibilityLabel={`${count === 1 ? 'Un vehículo' : `${count} vehículos`} sin registrar. Resolver`}
        depth={0.99}
        onPress={() => router.navigate('/alerts')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(251, 113, 133, 0.35)',
          backgroundColor: 'rgba(251, 113, 133, 0.12)',
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Animated.View
          style={[
            { height: 10, width: 10, borderRadius: radius.pill, backgroundColor: palette.danger },
            dotStyle,
          ]}
        />
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-state-danger" numberOfLines={1}>
            {count === 1 ? '1 vehículo sin registrar' : `${count} sin registrar`}
          </Text>
          <Text className="text-xs text-steel-300" numberOfLines={1}>
            Último en {latest.cameraName}
          </Text>
        </View>
        <PlateChip
          plate={latest.licensePlateNumber}
          colombian={isColombianPlate(latest.licensePlateNumber)}
          size="sm"
        />
        <View className="flex-row items-center gap-0.5">
          <Text className="text-sm font-semibold text-steel-100">Resolver</Text>
          <ChevronRightIcon size={16} color={palette.steel200} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}
