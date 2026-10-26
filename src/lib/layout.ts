import { useWindowDimensions } from 'react-native';

/** A partir de este ancho el menú queda fijo a la izquierda y desaparecen las pestañas. */
export const PERMANENT_MENU_BREAKPOINT = 1024;
export const SIDE_MENU_WIDTH = 288;
/** Evita que las tarjetas se estiren de lado a lado en monitores anchos. */
export const MAX_CONTENT_WIDTH = 860;
/** El monitor de cámaras usa más: varias cámaras lado a lado y la columna de alertas. */
export const WIDE_CONTENT_WIDTH = 1480;
/** Margen lateral de las pantallas (`padding: 20`). */
const SCREEN_PADDING = 20;

/** Ancho útil del contenido de una pantalla, ya descontado el menú fijo y los márgenes. */
export function useContentWidth(max: number = MAX_CONTENT_WIDTH): number {
  const { width } = useWindowDimensions();
  const menu = width >= PERMANENT_MENU_BREAKPOINT ? SIDE_MENU_WIDTH : 0;
  return Math.min(width - menu, max) - SCREEN_PADDING * 2;
}
