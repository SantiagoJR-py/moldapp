import { Text, View } from 'react-native';

import { passwordStrength } from '@/lib/validation';

type PasswordMeterProps = {
  password: string;
};

const barColor = ['bg-ink-600', 'bg-state-danger', 'bg-state-warning', 'bg-state-success'] as const;
const labelColor = [
  'text-steel-500',
  'text-state-danger',
  'text-state-warning',
  'text-state-success',
] as const;

export function PasswordMeter({ password }: PasswordMeterProps) {
  const { score, label } = passwordStrength(password);

  return (
    <View className="gap-2">
      <View className="flex-row gap-1.5">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            className={`h-1 flex-1 rounded-full ${step <= score ? barColor[score] : 'bg-ink-600'}`}
          />
        ))}
      </View>
      <Text className={`text-xs ${labelColor[score]}`}>Seguridad: {label}</Text>
    </View>
  );
}
