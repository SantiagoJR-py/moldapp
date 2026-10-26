import type { RoleNameValue } from '@/constants/roles';
import { request } from '@/lib/http';

/** Una cuenta de ENTRYX como la ve Administración. */
export type AdminUser = {
  id: number;
  fullName: string;
  email: string | null;
  identification: string | null;
  phone: string | null;
  urlImage: string | null;
  state: string;
  role: { id: number; name: string } | null;
  identificationType: { id: number; name: string | null } | null;
};

export const adminService = {
  /** GET /app/admin/users — por nombre, correo o documento; sin texto, las más recientes. */
  async users(search: string): Promise<AdminUser[]> {
    const query = search.trim()
      ? `?${new URLSearchParams({ search: search.trim() }).toString()}`
      : '';
    const response = await request<{ users: AdminUser[] }>(`/app/admin/users${query}`, {
      auth: true,
    });
    return response.users;
  },

  /** PATCH /app/admin/users/:id/role */
  async changeRole(userId: number, roleName: RoleNameValue): Promise<AdminUser> {
    const response = await request<{ user: AdminUser }>(`/app/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { roleName },
      auth: true,
    });
    return response.user;
  },
};
