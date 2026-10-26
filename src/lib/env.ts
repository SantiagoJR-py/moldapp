import { Platform } from 'react-native';

/** El emulador de Android no alcanza `localhost` del host, usa 10.0.2.2. */
const LOCAL_FALLBACK = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

const configured = process.env.EXPO_PUBLIC_API_URL ?? LOCAL_FALLBACK;

/**
 * En el navegador, el backend se busca en el mismo equipo desde el que se abrió la página
 * (`localhost` en el PC de portería, la IP si se abre desde otro equipo), con el puerto del
 * `.env`. La IP del `.env` es para el celular: si el PC abre `localhost` y llama a esa IP,
 * Chrome detiene las peticiones hasta que alguien autorice el "acceso a la red local".
 */
function apiUrl(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location?.hostname) {
    return configured;
  }

  try {
    const url = new URL(configured);
    url.hostname = window.location.hostname;
    return url.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

export const env = {
  apiUrl: apiUrl(),
} as const;
