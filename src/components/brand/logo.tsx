import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { palette } from '@/constants/theme';

type LogoMarkProps = {
  size?: number;
};

/**
 * Marca provisional: un molde (marco redondeado) con una "M" troquelada dentro.
 * Es SVG puro para que escale igual en móvil y en web.
 */
export function LogoMark({ size = 56 }: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="moldapp-mark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.accent300} />
          <Stop offset="1" stopColor={palette.accent600} />
        </LinearGradient>
      </Defs>
      <Rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={palette.ink800} />
      <Rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="14"
        stroke="url(#moldapp-mark)"
        strokeWidth="1.6"
        opacity={0.75}
      />
      <Path
        d="M14 32V18.5l10 8 10-8V32"
        stroke="url(#moldapp-mark)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14.5 36.5h19" stroke={palette.accent500} strokeWidth="2" strokeLinecap="round" opacity={0.35} />
    </Svg>
  );
}

type WordmarkProps = {
  size?: 'sm' | 'md';
};

export function Wordmark({ size = 'md' }: WordmarkProps) {
  return (
    <Text className={size === 'md' ? 'text-2xl font-semibold' : 'text-lg font-semibold'}>
      <Text className="text-white">Mold</Text>
      <Text className="text-accent-400">App</Text>
    </Text>
  );
}

type BrandHeaderProps = {
  markSize?: number;
  tagline?: string;
};

export function BrandHeader({ markSize = 56, tagline }: BrandHeaderProps) {
  return (
    <View className="items-center gap-3">
      <LogoMark size={markSize} />
      <Wordmark />
      {tagline ? (
        <Text className="text-center text-sm text-steel-400">{tagline}</Text>
      ) : null}
    </View>
  );
}
