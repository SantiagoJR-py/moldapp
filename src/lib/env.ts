import { Platform } from 'react-native';

/** El emulador de Android no alcanza `localhost` del host, usa 10.0.2.2. */
const LOCAL_FALLBACK = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? LOCAL_FALLBACK,
  /** Prefijo que monta `authRouter` en moldapp-back (`app.use('/app/user', authRouter)`). */
  authBasePath: '/app/user',
} as const;
