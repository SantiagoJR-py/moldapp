import { request } from '@/lib/http';

export type AuthUser = {
  id: number;
  fullName: string;
  email: string | null;
  urlImage: string | null;
  hash: string | null;
  roleId: number;
  identificationTypeId: number;
  sessionId: number | null;
  state: string;
  role?: { id: number; name: string };
  identificationType?: { id: number; name: string | null };
};

const BASE = '/app/user';

type LoginResponse = { token: string; user: AuthUser };
type MessageResponse = { ok?: boolean; error?: string | null; msg?: string; message?: string };

export const authService = {
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>(`${BASE}/login`, {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
    });
  },

  signUp(input: {
    fullName: string;
    email: string;
    password: string;
    identificationTypeId: number;
  }): Promise<MessageResponse> {
    return request<MessageResponse>(`${BASE}/sign-up`, {
      method: 'POST',
      body: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        identificationTypeId: input.identificationTypeId,
      },
    });
  },

  /** Envía el correo con el enlace `/password/:hash`. */
  requestPasswordReset(email: string): Promise<MessageResponse> {
    return request<MessageResponse>(`${BASE}/resetPassword`, {
      method: 'POST',
      body: { email: email.trim().toLowerCase() },
    });
  },

  verifyHash(hash: string): Promise<MessageResponse> {
    return request<MessageResponse>(`${BASE}/${encodeURIComponent(hash)}/verifyHash`);
  },

  changePassword(hash: string, password: string): Promise<MessageResponse> {
    return request<MessageResponse>(`${BASE}/${encodeURIComponent(hash)}/changePassword`, {
      method: 'POST',
      body: { password },
    });
  },
};
