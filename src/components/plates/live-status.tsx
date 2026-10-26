import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette, radius } from '@/constants/theme';

export type FeedStatus = 'loading' | 'live' | 'offline' | 'forbidden';

export function LiveStatus({ status }: { status: FeedStatus }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status !== 'live' || reduceMotion) {
      pulse.set(1);
      return;
    }
    pulse.set(withRepeat(withTiming(0.35, { duration: 900 }), -1, true));
  }, [status, reduceMotion, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const copy: Record<FeedStatus, { text: string; color: string }> = {
    loading: { text: 'Conectando con las cámaras…', color: palette.steel500 },
    live: { text: 'En vivo · se actualiza solo', color: palette.success },
    offline: { text: 'Sin conexión con el servidor · reintentando', color: palette.warning },
    forbidden: { text: 'Sin acceso', color: palette.danger },
  };

  return (
    <View className="flex-row items-center gap-2">
      <Animated.View
        style={[
          { height: 8, width: 8, borderRadius: radius.pill, backgroundColor: copy[status].color },
          dotStyle,
        ]}
      />
      <Text className="text-sm text-steel-300">{copy[status].text}</Text>
    </View>
  );
}
