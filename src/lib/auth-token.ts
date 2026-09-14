/**
 * Copia en memoria del token para que el cliente HTTP no tenga que leer el
 * almacenamiento en cada petición. La fuente de verdad es `SessionProvider`.
 */
let token: string | null = null;

export function setAuthToken(value: string | null): void {
  token = value;
}

export function getAuthToken(): string | null {
  return token;
}
