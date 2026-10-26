import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette, radius } from '@/constants/theme';
import { EyeIcon, EyeOffIcon } from './icons';

type TextFieldProps = Omit<TextInputProps, 'className'> & {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: ReactNode;
  /** Muestra el botón de mostrar/ocultar y arranca oculto. */
  secure?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, icon, secure = false, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // El borde se anima en vez de saltar de color: es un detalle pequeno, pero es
  // de los que separan una app que se siente cara de una que no.
  const progress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: motion.base }));

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? palette.danger
      : interpolateColor(progress.value, [0, 1], [palette.ink600, palette.accent500]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.ink800, 'rgba(20, 43, 66, 0.9)'],
    ),
  }));

  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-400">{label}</Text>

      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: radius.field,
            borderCurve: 'continuous',
            borderWidth: 1,
            paddingHorizontal: 16,
          },
          boxStyle,
        ]}
      >
        {icon ? <View className="shrink-0">{icon}</View> : null}

        <TextInput
          ref={ref}
          placeholderTextColor={palette.steel500}
          secureTextEntry={secure && !revealed}
          className="h-13 flex-1 text-base text-steel-100"
          // `outline-none` no aplica en RN; en web evita el contorno nativo del navegador.
          style={{ height: 52, outline: 'none' } as never}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={10}
            onPress={() => setRevealed((value) => !value)}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <Text className="text-xs text-state-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-steel-500">{hint}</Text>
      ) : null}
    </View>
  );
});
