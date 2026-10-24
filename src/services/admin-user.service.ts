import { request } from '@/lib/http';
import type { AccessLog } from './access.service';
import type { AuthUser } from './auth.service';
import type { Vehicle } from './vehicle.service';

export type AdminUser = Pick<
  AuthUser,
  | 'id'
  | 'fullName'
  | 'email'
  | 'identification'
  | 'phone'
  | 'urlImage'
  | 'state'
  | 'roleId'
  | 'role'
  | 'identificationType'
> & {
  createdAt?: string;
};

export type AdminAsset = {
  id: number;
  description: string;
  state: string;
  brand?: { id: number; name: string } | null;
  type?: { id: number; name: string } | null;
};

export type FrequentVehicle = {
  uses: number;
  vehicle: Vehicle;
};

export type FrequentAsset = {
  uses: number;
  asset: AdminAsset;
};

export type AdminUserDetail = {
  ok: boolean;
  user: AdminUser;
  vehicles: Vehicle[];
  assets: AdminAsset[];
  openAccess: Pick<AccessLog, 'id' | 'date' | 'checkInTime' | 'state'> | null;
  accessCount: number;
  frequentVehicles: FrequentVehicle[];
  frequentAssets: FrequentAsset[];
};

export type AdminUserPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminRole = {
  id: number;
  name: string;
  state: string;
};

export type AdminUserListFilters = {
  page?: number;
  pageSize?: number;
  name?: string;
  identification?: string;
  role?: string;
  state?: string;
};

type AdminUserListResponse = {
  ok: boolean;
  users: AdminUser[];
  pagination: AdminUserPagination;
};

function toQuery(filters: AdminUserListFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.name?.trim()) params.set('name', filters.name.trim());
  if (filters.identification?.trim()) {
    params.set('identification', filters.identification.trim());
  }
  if (filters.role) params.set('role', filters.role);
  if (filters.state) params.set('state', filters.state);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const adminUserService = {
  list(filters: AdminUserListFilters = {}): Promise<AdminUserListResponse> {
    return request<AdminUserListResponse>(`/app/users${toQuery(filters)}`, { auth: true });
  },

  one(id: number): Promise<AdminUserDetail> {
    return request<AdminUserDetail>(`/app/users/${id}`, { auth: true });
  },

  roles(): Promise<{ ok: boolean; roles: AdminRole[] }> {
    return request<{ ok: boolean; roles: AdminRole[] }>('/app/roles', { auth: true });
  },

  updateRole(userId: number, roleId: number): Promise<AdminUserDetail> {
    return request<AdminUserDetail>(`/app/users/${userId}/role`, {
      method: 'PATCH',
      auth: true,
      body: { roleId },
    });
  },
};
