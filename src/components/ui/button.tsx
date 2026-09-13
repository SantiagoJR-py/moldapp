import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
};

const container: Record<Variant, string> = {
  primary: 'bg-accent-600',
  outline: 'border border-ink-600 bg-ink-800',
  ghost: 'bg-transparent',
};

const labelColor: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-steel-200',
  ghost: 'text-accent-400',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`h-12 flex-row items-center justify-center rounded-field px-5 ${container[variant]} ${
        inactive ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? palette.white : palette.accent400}
        />
      ) : (
        <Text className={`text-base font-semibold ${labelColor[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}

type LinkButtonProps = {
  label: string;
  onPress: () => void;
  align?: 'left' | 'center' | 'right';
};

export function LinkButton({ label, onPress, align = 'center' }: LinkButtonProps) {
  const alignment =
    align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center';

  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} className={alignment}>
      <View>
        <Text className="text-sm font-medium text-accent-400 active:opacity-70">{label}</Text>
      </View>
    </Pressable>
  );
}
