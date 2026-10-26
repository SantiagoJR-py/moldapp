import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette, radius, spring } from '@/constants/theme';

const HEIGHT = 52;

type Variant = 'primary' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Texto que asoma al presionar. Por defecto se repite el mismo. */
  revealLabel?: string;
};

const surface: Record<Variant, { background: string; border: string; label: string }> = {
  primary: { background: palette.accent600, border: palette.accent600, label: palette.white },
  outline: { background: palette.ink800, border: palette.ink600, label: palette.steel100 },
  ghost: { background: 'transparent', border: 'transparent', label: palette.accent400 },
};

/** Color del panel que sube al presionar, por variante. */
const reveal: Record<Variant, { background: string; label: string }> = {
  primary: { background: palette.accent400, label: palette.ink950 },
  outline: { background: palette.accent600, label: palette.white },
  ghost: { background: palette.ink800, label: palette.accent300 },
};

/**
 * Boton con revelado vertical: la etiqueta sube y se desvanece mientras otra
 * entra desde abajo sobre un panel de acento.
 *
 * El diseno de referencia hacia esto con `group-hover`, que en un movil no
 * existe: un dedo no flota sobre nada, solo toca. Aqui el disparador es el
 * estado de presion, que es su equivalente tactil, y el panel ademas endereza
 * sus esquinas mientras entra, igual que el original.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  revealLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const press = useSharedValue(0);
  const scale = useSharedValue(1);

  const colors = surface[variant];
  const revealColors = reveal[variant];

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - press.value,
    transform: [{ translateY: -HEIGHT * press.value }],
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: press.value,
    transform: [{ translateY: HEIGHT * (1 - press.value) }],
    borderRadius: radius.field * (1 - press.value),
  }));

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const engage = () => {
    // `.set()` en vez de `.value =`: el proyecto compila con React Compiler, que
    // marca la asignacion directa como mutacion prohibida. Es la API que
    // Reanimated anadio justo para convivir con el.
    press.set(withTiming(1, { duration: motion.fast }));
    scale.set(withSpring(0.97, spring.press));
    // El toque ligero es lo que hace que un boton se sienta fisico en iOS.
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const release = () => {
    press.set(withTiming(0, { duration: motion.base }));
    scale.set(withSpring(1, spring.press));
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={engage}
        onPressOut={release}
        onPress={onPress}
        style={{
          height: HEIGHT,
          borderRadius: radius.field,
          borderCurve: 'continuous',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          backgroundColor: colors.background,
          overflow: 'hidden',
          justifyContent: 'center',
          opacity: inactive ? 0.45 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? palette.white : palette.accent400}
          />
        ) : (
          <>
            <Animated.View style={[{ alignItems: 'center' }, labelStyle]}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.label }}>{label}</Text>
            </Animated.View>

            <Animated.View
              style={[
                {
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: revealColors.background,
                },
                panelStyle,
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: revealColors.label }}>
                {revealLabel ?? label}
              </Text>
            </Animated.View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

type LinkButtonProps = {
  label: string;
  onPress: () => void;
  align?: 'left' | 'center' | 'right';
};

export function LinkButton({ label, onPress, align = 'center' }: LinkButtonProps) {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const alignment = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        opacity.set(withTiming(0.55, { duration: motion.fast }));
      }}
      onPressOut={() => {
        opacity.set(withTiming(1, { duration: motion.base }));
      }}
      hitSlop={10}
      style={{ alignItems: alignment }}
    >
      <Animated.View style={style}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: palette.accent400 }}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
