import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { getAuthToken, setAuthToken } from '@/lib/auth-token';
import { ApiError } from '@/lib/http';
import {
  clearSession,
  loadSession,
  loadSessionSync,
  saveSession,
} from '@/lib/session-store';
import { authService, type AuthUser } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';

type SessionValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  /** Reemplaza el usuario en memoria y en disco tras editar el perfil. */
  setUser: (user: AuthUser) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // En web leemos localStorage una sola vez al montar para no perder la sesión
  // al recargar o al navegar entre rutas estáticas de Expo.
  const [boot] = useState(() => (Platform.OS === 'web' ? loadSessionSync() : null));
  const [token, setToken] = useState<string | null>(boot?.token ?? null);
  const [user, setUserState] = useState<AuthUser | null>(boot?.user ?? null);
  const [loading, setLoading] = useState(Platform.OS !== 'web');
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useLayoutEffect(() => {
    if (boot?.token) {
      setAuthToken(boot.token);
    }
  }, [boot]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const stored = await loadSession();

      if (!active) return;

      if (!stored) {
        setAuthToken(null);
        setToken(null);
        setUserState(null);
        setLoading(false);
        return;
      }

      setAuthToken(stored.token);
      setToken(stored.token);
      setUserState(stored.user);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const setUser = useCallback(async (next: AuthUser) => {
    setUserState(next);
    const current = tokenRef.current ?? getAuthToken();
    if (current) {
      await saveSession(current, next);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);

    setAuthToken(result.token);
    setToken(result.token);
    setUserState(result.user);
    await saveSession(result.token, result.user);

    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUserState(null);
    await clearSession();
  }, []);

  /**
   * Trae el perfil actualizado. Solo cierra sesión si el token ya no es válido
   * (401/403); un fallo de red no debe borrar lo guardado en disco.
   */
  const refreshProfile = useCallback(async () => {
    try {
      await setUser(await profileService.me());
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      if (status === 401 || status === 403) {
        await signOut();
      }
    }
  }, [setUser, signOut]);

  const value = useMemo<SessionValue>(
    () => ({ token, user, loading, signIn, signOut, setUser, refreshProfile }),
    [token, user, loading, signIn, signOut, setUser, refreshProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>');
  }

  return context;
}
