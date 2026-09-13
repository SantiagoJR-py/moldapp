/** `expo-secure-store` no existe en web; el export estático además corre sin `window`. */
function memory(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    return memory()?.getItem(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memory()?.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memory()?.removeItem(key);
  },
};
