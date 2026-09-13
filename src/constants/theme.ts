/**
 * Espejo en JS de la paleta definida en `tailwind.config.js`.
 * Se usa donde no llega NativeWind: navegación, status bar, gradientes y SVG.
 */
export const palette = {
  ink950: '#080B10',
  ink900: '#0C1117',
  ink800: '#121924',
  ink700: '#1A2331',
  ink600: '#243040',
  steel700: '#2A3644',
  steel600: '#3A4859',
  steel500: '#55657A',
  steel400: '#7C8A9C',
  steel300: '#A3AFBF',
  steel200: '#C9D2DD',
  steel100: '#E7ECF2',
  accent700: '#1668B8',
  accent600: '#1E7FD6',
  accent500: '#3A98EA',
  accent400: '#5FB0F2',
  accent300: '#8FC9F8',
  accent200: '#C2E2FC',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  white: '#FFFFFF',
} as const;

/** Ancho máximo del contenido en web para que no se estire en pantallas grandes. */
export const MAX_FORM_WIDTH = 420;
