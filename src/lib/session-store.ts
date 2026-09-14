import type { AuthUser } from '@/services/auth.service';

import { storage } from './storage';

export const TOKEN_KEY = 'moldapp.token';
export const USER_KEY = 'moldapp.user';
export const SESSION_META_KEY = 'moldapp.session.meta';

/** Duración mínima de la sesión en el cliente (7 días). */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionMeta = {
  savedAt: number;
};

export type StoredSession = {
  token: string;
  user: AuthUser;
};

function parseUser(raw: string | null): AuthUser | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function parseMeta(raw: string | null): SessionMeta | null {
  if (!raw) return null;

  try {
    const meta = JSON.parse(raw) as SessionMeta;
    return typeof meta.savedAt === 'number' ? meta : null;
  } catch {
    return null;
  }
}

function isExpired(meta: SessionMeta | null): boolean {
  // Sesiones viejas sin meta: se conservan y se les pone fecha al guardar de nuevo.
  if (!meta) return false;
  return Date.now() - meta.savedAt > SESSION_TTL_MS;
}

/** Lectura síncrona solo en el navegador: evita perder la sesión en el primer paint/SSR. */
export function loadSessionSync(): StoredSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const user = parseUser(window.localStorage.getItem(USER_KEY));
    const meta = parseMeta(window.localStorage.getItem(SESSION_META_KEY));

    if (!token || !user || isExpired(meta)) return null;

    return { token, user };
  } catch {
    return null;
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  const [token, userRaw, metaRaw] = await Promise.all([
    storage.getItem(TOKEN_KEY),
    storage.getItem(USER_KEY),
    storage.getItem(SESSION_META_KEY),
  ]);

  const user = parseUser(userRaw);
  const meta = parseMeta(metaRaw);

  if (!token || !user) return null;

  if (isExpired(meta)) {
    await clearSession();
    return null;
  }

  // Migración: sesiones guardadas antes de tener meta.
  if (!meta) {
    await storage.setItem(SESSION_META_KEY, JSON.stringify({ savedAt: Date.now() } satisfies SessionMeta));
  }

  return { token, user };
}

export async function saveSession(token: string, user: AuthUser): Promise<void> {
  await Promise.all([
    storage.setItem(TOKEN_KEY, token),
    storage.setItem(USER_KEY, JSON.stringify(user)),
    storage.setItem(SESSION_META_KEY, JSON.stringify({ savedAt: Date.now() } satisfies SessionMeta)),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    storage.removeItem(TOKEN_KEY),
    storage.removeItem(USER_KEY),
    storage.removeItem(SESSION_META_KEY),
  ]);
}
