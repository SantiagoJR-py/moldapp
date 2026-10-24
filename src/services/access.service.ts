import { request } from '@/lib/http';
import type { AuthUser } from './auth.service';
import type { Vehicle } from './vehicle.service';

export type AccessAssetRow = {
  id: number;
  moment: string;
  declared: boolean | null;
  note: string | null;
  asset?: {
    id: number;
    description: string;
    brand?: { id: number; name: string };
    type?: { id: number; name: string };
  };
  assetId?: number;
};

export type AccessPerson = Pick<
  AuthUser,
  'id' | 'fullName' | 'email' | 'identification' | 'phone'
> & {
  role?: { id: number; name: string } | null;
};

export type AccessLog = {
  id: number;
  userId: number;
  vehicleId: number | null;
  checkOutVehicleId?: number | null;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  notes: string | null;
  state: string;
  vehicle?: Vehicle | null;
  checkOutVehicle?: Vehicle | null;
  accessAssets?: AccessAssetRow[];
  user?: AccessPerson;
};

export type SuggestedAsset = {
  id: number;
  description: string;
  brand?: { id: number; name: string };
  type?: { id: number; name: string };
};

export type AccessPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AccessAdminFilters = {
  page?: number;
  pageSize?: number;
  userId?: number;
  name?: string;
  identification?: string;
  state?: 'INSIDE' | 'OUTSIDE' | '';
  withVehicle?: boolean | null;
  withDevice?: boolean | null;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
};

type LookupResponse = {
  ok: boolean;
  user: AuthUser;
  openAccess: AccessLog | null;
  suggestedVehicles: Vehicle[];
  suggestedAssets: SuggestedAsset[];
};

type AccessListResponse = { ok: boolean; accesses: AccessLog[] };
type AccessOneResponse = { ok: boolean; access: AccessLog };
type AccessAdminListResponse = {
  ok: boolean;
  accesses: AccessLog[];
  pagination: AccessPagination;
};

export type CheckInBody = {
  userId: number;
  vehicleId?: number | null;
  newVehicle?: {
    licensePlateNumber: string;
    brandId: number;
    versionId: number;
    model: number;
  } | null;
  assetIds?: number[];
  newAssets?: Array<{
    description: string;
    assetsBrandId: number;
    assetsTypeId: number;
  }>;
  notes?: string | null;
};

export type CheckOutBody = {
  vehicleId?: number | null;
  assetIds?: number[];
};

function toQuery(filters: AccessAdminFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.userId) params.set('userId', String(filters.userId));
  if (filters.name?.trim()) params.set('name', filters.name.trim());
  if (filters.identification?.trim()) {
    params.set('identification', filters.identification.trim());
  }
  if (filters.state) params.set('state', filters.state);
  if (filters.withVehicle === true) params.set('withVehicle', 'true');
  if (filters.withVehicle === false) params.set('withVehicle', 'false');
  if (filters.withDevice === true) params.set('withDevice', 'true');
  if (filters.withDevice === false) params.set('withDevice', 'false');
  if (filters.role) params.set('role', filters.role);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const accessService = {
  /** Busca por número de documento (sin tipo). */
  lookup(identification: string): Promise<LookupResponse> {
    return request<LookupResponse>('/app/access/lookup', {
      method: 'POST',
      auth: true,
      body: { identification },
    });
  },

  checkIn(body: CheckInBody): Promise<AccessOneResponse> {
    return request<AccessOneResponse>('/app/access/check-in', {
      method: 'POST',
      auth: true,
      body,
    });
  },

  checkOut(accessLogId: number, body: CheckOutBody): Promise<AccessOneResponse> {
    return request<AccessOneResponse>(`/app/access/${accessLogId}/check-out`, {
      method: 'POST',
      auth: true,
      body,
    });
  },

  mine(): Promise<AccessListResponse> {
    return request<AccessListResponse>('/app/access/me', { auth: true });
  },

  mineOne(id: number): Promise<AccessOneResponse> {
    return request<AccessOneResponse>(`/app/access/me/${id}`, { auth: true });
  },

  /** Listado paginado para personal administrativo. */
  adminList(filters: AccessAdminFilters = {}): Promise<AccessAdminListResponse> {
    return request<AccessAdminListResponse>(`/app/access${toQuery(filters)}`, {
      auth: true,
    });
  },

  adminOne(id: number): Promise<AccessOneResponse> {
    return request<AccessOneResponse>(`/app/access/${id}`, { auth: true });
  },
};
