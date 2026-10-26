import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette, radius } from '@/constants/theme';
import { CheckIcon, ChevronDownIcon } from './icons';

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

/** Misma altura que `TextField`, para que un formulario mixto no se vea escalonado. */
const FIELD_HEIGHT = 52;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
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

  const progress = useDerivedValue(() => withTiming(open ? 1 : 0, { duration: motion.base }));

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? palette.danger
      : interpolateColor(progress.value, [0, 1], [palette.ink600, palette.accent500]),
  }));

  // El galón gira en vez de cambiar de glifo: el movimiento dice "se abrio"
  // mejor que un triangulo que salta.
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  function close() {
    setOpen(false);
    setQuery('');
  }

  function pick(optionValue: number) {
    onChange(optionValue);
    close();
  }

  const boxBase = {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.field,
    borderCurve: 'continuous',
    borderWidth: 1,
    backgroundColor: palette.ink800,
    paddingHorizontal: 16,
  } as const;

  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-400">{label}</Text>

      {open && canSearch ? (
        <Animated.View style={[boxBase, boxStyle]}>
          {icon}
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Escribe para filtrar…"
            placeholderTextColor={palette.steel500}
            className="flex-1 text-base text-steel-100"
            style={{ height: FIELD_HEIGHT, outline: 'none' } as never}
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
            <Animated.View style={chevronStyle}>
              <ChevronDownIcon size={18} color={palette.accent400} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((current) => !current)}
        >
          <Animated.View style={[boxBase, boxStyle]}>
            {icon}
            <Text className={`flex-1 text-base ${selected ? 'text-steel-100' : 'text-steel-500'}`}>
              {selected?.label ?? placeholder}
            </Text>
            <Animated.View style={chevronStyle}>
              <ChevronDownIcon size={18} color={open ? palette.accent400 : palette.steel400} />
            </Animated.View>
          </Animated.View>
        </Pressable>
      )}

      {open ? (
        <Animated.View
          entering={FadeInUp.duration(motion.base).springify().damping(22)}
          exiting={FadeOut.duration(motion.fast)}
          style={{
            overflow: 'hidden',
            borderRadius: radius.field,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: palette.ink600,
            backgroundColor: palette.ink800,
            boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.45)',
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={{ maxHeight: 260 }}
          >
            {filtered.length === 0 ? (
              <View className="px-4 py-3">
                <Text className="text-sm text-steel-500">
                  Sin coincidencias para “{query.trim()}”.
                </Text>
              </View>
            ) : (
              filtered.map((option, index) => (
                <Animated.View
                  key={option.value}
                  entering={FadeIn.duration(motion.fast).delay(Math.min(index, 8) * 18)}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: option.value === value }}
                    onPress={() => pick(option.value)}
                    className={`flex-row items-center justify-between px-4 py-3.5 active:bg-ink-700 ${
                      index > 0 ? 'border-t border-ink-700' : ''
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        option.value === value ? 'font-medium text-accent-300' : 'text-steel-200'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {option.value === value ? (
                      <CheckIcon size={16} color={palette.accent300} />
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      ) : null}

      {error ? <Text className="text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}
