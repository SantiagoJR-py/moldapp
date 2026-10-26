import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { spring } from '@/constants/theme';

type PressableScaleProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Cuanto se hunde al tocar. Las superficies grandes se hunden menos. */
  depth?: number;
  haptic?: boolean;
};

/**
 * Superficie tactil que se hunde al presionar.
 *
 * Es el gesto que hace que una fila se sienta fisica en iOS, y el motivo por el
 * que existe como primitiva: se repite en el inicio, en vehiculos y en
 * cualquier lista que venga despues.
 */
export function PressableScale({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
  depth = 0.98,
  haptic = true,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => {
        // Ver la nota en `button.tsx`: `.set()` es lo que acepta React Compiler.
        scale.set(withSpring(depth, spring.press));
        if (haptic && Platform.OS !== 'web') {
          Haptics.selectionAsync().catch(() => {});
        }
      }}
      onPressOut={() => {
        scale.set(withSpring(1, spring.press));
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
