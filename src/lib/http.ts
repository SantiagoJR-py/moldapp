import { env } from './env';
import { clientHeaders } from './device';

const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** moldapp-back responde `{ error: true, msg }` o `{ ok: false, error }` según el endpoint. */
function messageFromPayload(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    if (typeof body.msg === 'string') return body.msg;
    if (typeof body.error === 'string') return body.error;
  }

  return `La petición falló (HTTP ${status})`;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${env.apiUrl}${env.authBasePath}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(await clientHeaders()),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder.', 408);
    }

    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión.', 0);
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const payload: unknown = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(messageFromPayload(payload, response.status), response.status);
  }

  return payload as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
