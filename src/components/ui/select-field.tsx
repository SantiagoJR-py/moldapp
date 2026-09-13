import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { CheckIcon } from './icons';

export type SelectOption = {
  value: number;
  label: string;
};

type SelectFieldProps = {
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  value: number | null;
  onChange: (value: number) => void;
  error?: string | null;
  icon?: ReactNode;
};

/** Desplegable inline: evita modales nativos y se comporta igual en web y móvil. */
export function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  icon,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-400">{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        className={`h-12 flex-row items-center gap-3 rounded-field border bg-ink-800 px-4 ${
          error ? 'border-state-danger' : open ? 'border-accent-500' : 'border-ink-600'
        }`}
      >
        {icon}
        <Text className={`flex-1 text-base ${selected ? 'text-steel-100' : 'text-steel-500'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="text-steel-400">{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open ? (
        <View className="overflow-hidden rounded-field border border-ink-600 bg-ink-800">
          {options.map((option, index) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex-row items-center justify-between px-4 py-3 active:bg-ink-700 ${
                index > 0 ? 'border-t border-ink-700' : ''
              }`}
            >
              <Text
                className={`text-sm ${option.value === value ? 'text-accent-300' : 'text-steel-200'}`}
              >
                {option.label}
              </Text>
              {option.value === value ? <CheckIcon size={16} color={palette.accent300} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? <Text className="text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}
