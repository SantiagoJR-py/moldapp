import type { TextStyle } from 'react-native';

import { surface } from '@/constants/theme';

/** Tarjeta base de las pantallas de placas (historial y consola de detección). */
export const plateCard = surface;

/** Números de ancho fijo: las horas y los porcentajes no bailan al cambiar. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
