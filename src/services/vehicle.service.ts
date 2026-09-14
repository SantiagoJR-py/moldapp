import { request } from '@/lib/http';

export type VehicleRef = {
  id: number;
  name: string | null;
};

export type Vehicle = {
  id: number;
  licensePlateNumber: string;
  model: number;
  brandId: number;
  versionId: number;
  brand: VehicleRef | null;
  version: VehicleRef | null;
};

export type VehicleBrand = {
  id: number;
  name: string | null;
  versions: VehicleRef[];
};

export type VehicleInput = {
  licensePlateNumber: string;
  brandId: number;
  versionId: number;
  model: number;
};

type VehiclesResponse = { ok: boolean; vehicles: Vehicle[] };
type VehicleResponse = { ok: boolean; vehicle: Vehicle };
type BrandsResponse = { ok: boolean; brands: VehicleBrand[] };

export const vehicleService = {
  /** GET /app/vehicles/me */
  async mine(): Promise<Vehicle[]> {
    const response = await request<VehiclesResponse>('/app/vehicles/me', { auth: true });
    return response.vehicles;
  },

  /** GET /app/vehicle-brands — marcas con sus versiones para armar el formulario. */
  async brands(): Promise<VehicleBrand[]> {
    const response = await request<BrandsResponse>('/app/vehicle-brands', { auth: true });
    return response.brands;
  },

  /** POST /app/vehicles */
  async create(input: VehicleInput): Promise<Vehicle> {
    const response = await request<VehicleResponse>('/app/vehicles', {
      method: 'POST',
      auth: true,
      body: input,
    });

    return response.vehicle;
  },

  /** PATCH /app/vehicles/:id */
  async update(id: number, input: VehicleInput): Promise<Vehicle> {
    const response = await request<VehicleResponse>(`/app/vehicles/${id}`, {
      method: 'PATCH',
      auth: true,
      body: input,
    });

    return response.vehicle;
  },

  /** DELETE /app/vehicles/:id */
  async remove(id: number): Promise<void> {
    await request(`/app/vehicles/${id}`, { method: 'DELETE', auth: true });
  },
};
