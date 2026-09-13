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
};

type LoginResponse = { token: string; user: AuthUser };
type MessageResponse = { ok?: boolean; error?: string | null; msg?: string; message?: string };

export const authService = {
  /** POST /app/user/login */
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
    });
  },

  /** POST /app/user/sign-up */
  signUp(input: {
    fullName: string;
    email: string;
    password: string;
    identificationTypeId: number;
  }): Promise<MessageResponse> {
    return request<MessageResponse>('/sign-up', {
      method: 'POST',
      body: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        identificationTypeId: input.identificationTypeId,
      },
    });
  },

  /** POST /app/user/resetPassword — envía el correo con el link `/password/:hash`. */
  requestPasswordReset(email: string): Promise<MessageResponse> {
    return request<MessageResponse>('/resetPassword', {
      method: 'POST',
      body: { email: email.trim().toLowerCase() },
    });
  },

  /** GET /app/user/:hash/verifyHash */
  verifyHash(hash: string): Promise<MessageResponse> {
    return request<MessageResponse>(`/${encodeURIComponent(hash)}/verifyHash`);
  },

  /** POST /app/user/:hash/changePassword */
  changePassword(hash: string, password: string): Promise<MessageResponse> {
    return request<MessageResponse>(`/${encodeURIComponent(hash)}/changePassword`, {
      method: 'POST',
      body: { password },
    });
  },
};
