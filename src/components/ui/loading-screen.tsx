import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Isotype } from '@/components/brand/logo';
import { palette } from '@/constants/theme';

type LoadingScreenProps = {
  /** Se muestra bajo la marca. Sin texto la espera se siente mas larga. */
  message?: string;
};

/**
 * Pantalla de espera con la marca.
 *
 * Sustituye al disco girando sobre negro: es lo primero que se ve en cada
 * arranque y en la comprobacion de sesion, asi que es donde mas barato sale
 * que la app se sienta cuidada. El isotipo respira en vez de girar, que es mas
 * sobrio y no compite con el contenido que viene detras.
 */
export function LoadingScreen({ message }: LoadingScreenProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [pulse]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 0.96 + pulse.value * 0.04 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + pulse.value * 0.16,
    transform: [{ scale: 1 + pulse.value * 0.22 }],
  }));

  return (
    <View
      className="flex-1 items-center justify-center gap-5"
      style={{ backgroundColor: palette.ink950 }}
    >
      <View className="items-center justify-center">
        {/* Halo detras de la marca: da profundidad sin cargar la escena. */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              height: 108,
              width: 108,
              borderRadius: 54,
              backgroundColor: palette.accent600,
            },
            haloStyle,
          ]}
        />
        <Animated.View style={markStyle}>
          <Isotype size={62} />
        </Animated.View>
      </View>

      {message ? <Text className="text-sm text-steel-500">{message}</Text> : null}
    </View>
  );
}
