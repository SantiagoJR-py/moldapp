import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { motion, palette } from '@/constants/theme';
import { passwordStrength } from '@/lib/validation';

type PasswordMeterProps = {
  password: string;
};

const BAR_COLOR = [palette.ink600, palette.danger, palette.warning, palette.success] as const;

const LABEL_COLOR = [
  'text-steel-400',
  'text-state-danger',
  'text-state-warning',
  'text-state-success',
] as const;

/** Un tramo de la barra. Se anima el color en vez de conmutarlo de golpe. */
function Segment({ filled, color }: { filled: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(filled ? color : palette.ink600, { duration: motion.base }),
  }));

  return <Animated.View style={[{ height: 4, flex: 1, borderRadius: 2 }, style]} />;
}

export function PasswordMeter({ password }: PasswordMeterProps) {
  const { score, label } = passwordStrength(password);

  return (
    <View className="gap-2">
      <View className="flex-row gap-1.5">
        {[1, 2, 3].map((step) => (
          <Segment key={step} filled={step <= score} color={BAR_COLOR[score]} />
        ))}
      </View>
      <Text className={`text-xs ${LABEL_COLOR[score]}`}>Seguridad: {label}</Text>
    </View>
  );
}
