import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
  /**
   * Activa el filtro al escribir. Por defecto se enciende cuando hay más de
   * 8 opciones (marcas, versiones, etc.).
   */
  searchable?: boolean;
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Desplegable inline: evita modales nativos y se comporta igual en web y móvil. */
export function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  icon,
  searchable,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const canSearch = searchable ?? options.length > 8;

  const needle = normalize(query);
  const filtered =
    canSearch && needle
      ? options.filter((option) => normalize(option.label).includes(needle))
      : options;

  function close() {
    setOpen(false);
    setQuery('');
  }

  function pick(optionValue: number) {
    onChange(optionValue);
    close();
  }

  const borderClass = error
    ? 'border-state-danger'
    : open
      ? 'border-accent-500'
      : 'border-ink-600';

  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-400">{label}</Text>

      {open && canSearch ? (
        <View
          className={`h-12 flex-row items-center gap-3 rounded-field border bg-ink-800 px-4 ${borderClass}`}
        >
          {icon}
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Escribe para filtrar…"
            placeholderTextColor={palette.steel500}
            className="h-12 flex-1 text-base text-steel-100"
            style={{ outline: 'none' } as never}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar lista"
            hitSlop={8}
            onPress={close}
          >
            <Text className="text-steel-400">▲</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((current) => !current)}
          className={`h-12 flex-row items-center gap-3 rounded-field border bg-ink-800 px-4 ${borderClass}`}
        >
          {icon}
          <Text className={`flex-1 text-base ${selected ? 'text-steel-100' : 'text-steel-500'}`}>
            {selected?.label ?? placeholder}
          </Text>
          <Text className="text-steel-400">{open ? '▲' : '▼'}</Text>
        </Pressable>
      )}

      {open ? (
        <View className="overflow-hidden rounded-field border border-ink-600 bg-ink-800">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={{ maxHeight: 240 }}
          >
            {filtered.length === 0 ? (
              <View className="px-4 py-3">
                <Text className="text-sm text-steel-500">
                  Sin coincidencias para “{query.trim()}”.
                </Text>
              </View>
            ) : (
              filtered.map((option, index) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => pick(option.value)}
                  className={`flex-row items-center justify-between px-4 py-3 active:bg-ink-700 ${
                    index > 0 ? 'border-t border-ink-700' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      option.value === value ? 'text-accent-300' : 'text-steel-200'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {option.value === value ? (
                    <CheckIcon size={16} color={palette.accent300} />
                  ) : null}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}

      {error ? <Text className="text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}
