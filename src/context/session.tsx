import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { storage } from '@/lib/storage';
import { authService, type AuthUser } from '@/services/auth.service';

const TOKEN_KEY = 'moldapp.token';
const USER_KEY = 'moldapp.user';

type SessionValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [storedToken, storedUser] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);

      if (!active) return;

      setToken(storedToken);
      setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);

    await Promise.all([
      storage.setItem(TOKEN_KEY, result.token),
      storage.setItem(USER_KEY, JSON.stringify(result.user)),
    ]);

    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ token, user, loading, signIn, signOut }),
    [token, user, loading, signIn, signOut],
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
