import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { palette, radius, spring } from '@/constants/theme';

export type Segment<T extends string> = {
  value: T;
  label: string;
  /** Número junto a la etiqueta (por ejemplo, cuántos sin registrar hay). */
  count?: number;
};

type SegmentedProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

const PADDING = 3;
/** Por debajo de este ancho por segmento (celulares angostos) el número no cabe junto al texto. */
const COUNT_MIN_WIDTH = 84;

/** Control segmentado como el de iOS: la selección se desliza en vez de saltar. */
export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    segments.findIndex((segment) => segment.value === value),
    0,
  );
  const segmentWidth = width > 0 ? (width - PADDING * 2) / segments.length : 0;
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.set(withSpring(index * segmentWidth, spring.press));
  }, [index, segmentWidth, offset]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        borderRadius: radius.field,
        borderCurve: 'continuous',
        backgroundColor: palette.ink800,
        padding: PADDING,
      }}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: PADDING,
              bottom: PADDING,
              left: PADDING,
              width: segmentWidth,
              borderRadius: radius.field - PADDING,
              borderCurve: 'continuous',
              backgroundColor: palette.ink600,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.35)',
            },
            thumbStyle,
          ]}
        />
      ) : null}

      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              segment.count ? `${segment.label}, ${segment.count}` : segment.label
            }
            onPress={() => {
              if (selected) return;
              if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
              onChange(segment.value);
            }}
            style={{
              flex: 1,
              minHeight: 38,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 4,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: selected ? '600' : '500',
                color: selected ? palette.steel100 : palette.steel400,
              }}
            >
              {segment.label}
            </Text>
            {segment.count && segmentWidth >= COUNT_MIN_WIDTH ? (
              <View
                style={{
                  borderRadius: radius.pill,
                  backgroundColor: palette.danger,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: palette.ink950,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {segment.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
