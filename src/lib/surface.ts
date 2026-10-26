import { Platform } from 'react-native';

/** Dónde vive cada pantalla: `web` (registro, cambio de contraseña, consola de detección) o `mobile` (recuperación). */
export type Surface = 'mobile' | 'web';

export const currentSurface: Surface = Platform.OS === 'web' ? 'web' : 'mobile';

/**
 * `EXPO_PUBLIC_PREVIEW_ALL=1` abre todas las pantallas en cualquier plataforma.
 * Sirve para revisar el diseño móvil desde el navegador sin tocar el código.
 */
export const previewAllSurfaces = process.env.EXPO_PUBLIC_PREVIEW_ALL === '1';

export function isSurfaceAllowed(surface: Surface): boolean {
  return previewAllSurfaces || surface === currentSurface;
}

/**
 * Ruta inicial: el login, en ambas plataformas. En web también entra Portería a la consola
 * de detección; el registro sigue siendo solo web y se llega desde el login.
 */
export const entryRoute = '/login';
