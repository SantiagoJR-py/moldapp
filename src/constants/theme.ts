/**
 * Espejo en JS de la paleta definida en `tailwind.config.js`.
 * Se usa donde no llega NativeWind: navegacion, status bar, gradientes, SVG y
 * animaciones (Reanimated no acepta clases, solo valores).
 *
 * Si cambias un color aqui, cambialo tambien en `tailwind.config.js`.
 */
export const palette = {
  // Fondos y superficies.
  ink950: '#080C12',
  ink900: '#0D1B2A',
  ink800: '#142B42',
  ink700: '#1D3A56',
  ink600: '#31506B',
  ink500: '#3F6183',
  // Texto y bordes.
  steel700: '#31506B',
  steel600: '#475569',
  steel500: '#64748B',
  steel400: '#8494A8',
  steel300: '#A8B6C8',
  steel200: '#CBD5E1',
  steel100: '#F1F5F9',
  // Acento de marca.
  accent700: '#1B5FBF',
  accent600: '#2F80ED',
  accent500: '#3D8FF5',
  accent400: '#4DA3FF',
  accent300: '#7FBEFF',
  accent200: '#B3D9FF',
  // Estado.
  success: '#34D399',
  danger: '#FB7185',
  warning: '#FBBF24',
  white: '#FFFFFF',
} as const;

/** Rejilla de 4pt. Los pasos se nombran por tamano, nunca por uso. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Acompanar siempre de `borderCurve: 'continuous'` para la curva tipo iOS. */
export const radius = {
  field: 14,
  card: 20,
  sheet: 28,
  pill: 9999,
} as const;

/**
 * Duraciones compartidas para que todo el movimiento de la app se sienta
 * emparentado. En ms.
 */
export const motion = {
  fast: 140, // respuesta al toque: presion, toggle
  base: 240, // entrada y salida de elementos
  slow: 380, // superficies grandes: hojas, pantallas
} as const;

/**
 * Configuraciones de resorte para Reanimated. `press` es corto y seco para que
 * el boton conteste al instante; `enter` es el que da la sensacion de iOS.
 */
export const spring = {
  press: { damping: 18, stiffness: 420, mass: 0.5 },
  enter: { damping: 20, stiffness: 180, mass: 0.9 },
} as const;

/** Sombras como cadenas `boxShadow`, nunca las props legacy shadow/elevation. */
export const shadows = {
  card: '0px 1px 2px rgba(0, 0, 0, 0.30)',
  raised: '0px 6px 16px rgba(0, 0, 0, 0.38)',
  overlay: '0px 12px 32px rgba(0, 0, 0, 0.48)',
  accent: '0px 8px 24px rgba(47, 128, 237, 0.35)',
} as const;

/** Ancho maximo del contenido en web para que no se estire en pantallas grandes. */
export const MAX_FORM_WIDTH = 420;
