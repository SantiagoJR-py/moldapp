import type { TextStyle } from 'react-native';

import { palette, radius, shadows } from '@/constants/theme';

/** Tarjeta base de las pantallas de placas (historial y consola de detección). */
export const plateCard = {
  borderRadius: radius.card,
  borderCurve: 'continuous',
  borderWidth: 1,
  borderColor: palette.ink700,
  backgroundColor: palette.ink900,
  boxShadow: shadows.card,
} as const;

/** Números de ancho fijo: las horas y los porcentajes no bailan al cambiar. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
