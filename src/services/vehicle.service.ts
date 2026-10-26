import { request } from '@/lib/http';
import { appendFile, type PickedFile } from '@/lib/picked-file';

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
  color: string | null;
  vehicleClass: string | null;
};

export type VehicleBrand = {
  id: number;
  name: string | null;
  versions: VehicleRef[];
};

/** Marca y línea van por id (catálogo) o por nombre (leídas de la tarjeta y aún no catalogadas). */
export type VehicleInput = {
  licensePlateNumber: string;
  brandId?: number;
  versionId?: number;
  brandName?: string;
  lineName?: string;
  model: number;
  color: string | null;
  vehicleClass: string | null;
};

/** Datos leídos de la tarjeta de propiedad, listos para prellenar el formulario. */
export type CardProposal = {
  licensePlateNumber: string | null;
  brandId: number | null;
  brandName: string | null;
  versionId: number | null;
  lineName: string | null;
  model: number | null;
  color: string | null;
  vehicleClass: string | null;
  service: string | null;
};

export type ScanResult = {
  readable: boolean;
  proposal: CardProposal;
  /** Campos de `proposal` que la persona debe revisar. */
  review: (keyof CardProposal)[];
  plateTaken: boolean;
};

/** La lectura corre en el equipo de portería; la primera vez carga sus modelos. */
const SCAN_TIMEOUT_MS = 60 * 1000;

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

  /** POST /app/vehicles/scan-card — lee la tarjeta; no guarda ni el vehículo ni la foto. */
  async scanCard(photo: PickedFile): Promise<ScanResult> {
    const form = new FormData();
    appendFile(form, 'photo', photo);
    return request<ScanResult>('/app/vehicles/scan-card', {
      method: 'POST',
      auth: true,
      body: form,
      timeoutMs: SCAN_TIMEOUT_MS,
    });
  },

  /** DELETE /app/vehicles/:id */
  async remove(id: number): Promise<void> {
    await request(`/app/vehicles/${id}`, { method: 'DELETE', auth: true });
  },
};
