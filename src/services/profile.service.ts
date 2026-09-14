import { request } from '@/lib/http';
import type { AuthUser } from './auth.service';

type ProfileResponse = { ok: boolean; user: AuthUser };

export type ProfileUpdate = {
  fullName?: string;
  email?: string;
  phone?: string;
};

export type PhotoUpload = {
  uri: string;
  name: string;
  mimeType: string;
};

export const profileService = {
  /** GET /app/user/me */
  async me(): Promise<AuthUser> {
    const response = await request<ProfileResponse>('/app/user/me', { auth: true });
    return response.user;
  },

  /** PATCH /app/user/me — nombre, correo y teléfono; rol y documento los cambia un administrador. */
  async update(input: ProfileUpdate): Promise<AuthUser> {
    const response = await request<ProfileResponse>('/app/user/me', {
      method: 'PATCH',
      auth: true,
      body: input,
    });

    return response.user;
  },

  /** POST /app/user/me/photo */
  async uploadPhoto(photo: PhotoUpload): Promise<AuthUser> {
    const form = new FormData();

    // En web hay que mandar un Blob real; en nativo basta el descriptor con `uri`.
    if (photo.uri.startsWith('data:') || photo.uri.startsWith('blob:')) {
      const blob = await (await fetch(photo.uri)).blob();
      form.append('photo', blob, photo.name);
    } else {
      form.append('photo', {
        uri: photo.uri,
        name: photo.name,
        type: photo.mimeType,
      } as unknown as Blob);
    }

    const response = await request<ProfileResponse>('/app/user/me/photo', {
      method: 'POST',
      auth: true,
      body: form,
    });

    return response.user;
  },
};
