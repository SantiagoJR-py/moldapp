import { Pressable, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { CheckIcon } from './icons';

type CheckboxRowProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
};

/** Fila seleccionable con checkbox para sugerencias de portería. */
export function CheckboxRow({ label, hint, checked, onToggle }: CheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      className={`flex-row items-start gap-3 rounded-field border px-4 py-3 active:opacity-80 ${
        checked ? 'border-accent-500 bg-accent-500/10' : 'border-ink-600 bg-ink-800'
      }`}
    >
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
          checked ? 'border-accent-400 bg-accent-500' : 'border-steel-600 bg-ink-900'
        }`}
      >
        {checked ? <CheckIcon size={12} color={palette.white} /> : null}
      </View>

      <View className="flex-1 gap-0.5">
        <Text className={`text-sm ${checked ? 'text-accent-200' : 'text-steel-100'}`}>{label}</Text>
        {hint ? <Text className="text-xs text-steel-500">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}
