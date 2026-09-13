import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { palette } from '@/constants/theme';
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

  const borderClass = error
    ? 'border-state-danger'
    : focused
      ? 'border-accent-500'
      : 'border-ink-600';

  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-400">{label}</Text>

      <View
        className={`flex-row items-center gap-3 rounded-field border bg-ink-800 px-4 ${borderClass}`}
      >
        {icon ? <View className="shrink-0">{icon}</View> : null}

        <TextInput
          ref={ref}
          placeholderTextColor={palette.steel500}
          secureTextEntry={secure && !revealed}
          className="h-12 flex-1 text-base text-steel-100"
          // `outline-none` no aplica en RN; en web evita el contorno nativo del navegador.
          style={{ outline: 'none' } as never}
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
      </View>

      {error ? (
        <Text className="text-xs text-state-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-steel-500">{hint}</Text>
      ) : null}
    </View>
  );
});
