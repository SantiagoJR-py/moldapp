import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setAuthToken } from '@/lib/auth-token';
import { ApiError } from '@/lib/http';
import { storage } from '@/lib/storage';
import { authService, type AuthUser } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';

const TOKEN_KEY = 'entryx.token';
const USER_KEY = 'entryx.user';

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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [storedToken, storedUser] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);

      if (!active) return;

      setAuthToken(storedToken);
      setToken(storedToken);
      setUserState(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const setUser = useCallback(async (next: AuthUser) => {
    setUserState(next);
    await storage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login(email, password);

      setAuthToken(result.token);
      setToken(result.token);
      await storage.setItem(TOKEN_KEY, result.token);
      await setUser(result.user);

      return result.user;
    },
    [setUser],
  );

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUserState(null);
    await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);
  }, []);

  /**
   * Trae el perfil actualizado; si el token ya no sirve, cierra la sesión. Un corte de red o
   * un servidor lento no cierran nada: el vigilante no puede quedar fuera por un mal Wi-Fi.
   */
  const refreshProfile = useCallback(async () => {
    try {
      await setUser(await profileService.me());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await signOut();
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
