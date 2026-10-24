import { io, type Socket } from 'socket.io-client';

import { getAuthToken } from '@/lib/auth-token';
import { env } from '@/lib/env';
import type { AccessLog } from '@/services/access.service';

export const ACCESS_SOCKET_EVENT = 'access:updated';

export type AccessSocketPayload = {
  event: 'check-in' | 'check-out';
  access: AccessLog;
};

/** Conecta al canal de ingresos en vivo (solo ADMINISTRATIVE_STAFF en el back). */
export function connectAccessSocket(
  onUpdate: (payload: AccessSocketPayload) => void,
): Socket {
  const token = getAuthToken();

  const socket = io(env.apiUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    autoConnect: true,
  });

  socket.on(ACCESS_SOCKET_EVENT, onUpdate);

  return socket;
}
