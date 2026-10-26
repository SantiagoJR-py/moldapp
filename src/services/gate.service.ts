import { request } from '@/lib/http';
import { appendFile, type PickedFile } from '@/lib/picked-file';
import type { Detection } from './plate-detection.service';
import type { PlateRead } from './plate-read.service';
import type { VehicleInput } from './vehicle.service';

export type AlertStatus = 'PENDING' | 'REGISTERED' | 'ALLOWED_VISIT';

/** Un vehículo sin registrar que entró. Queda pendiente hasta inscribirlo o dejarlo pasar. */
export type GateAlert = {
  id: number;
  licensePlateNumber: string;
  status: AlertStatus;
  cameraName: string;
  source: 'CAMERA' | 'UPLOAD';
  imagePath: string | null;
  readsCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  vehicle: {
    id: number;
    licensePlateNumber: string;
    holderName: string | null;
    owner: { id: number; fullName: string } | null;
  } | null;
  resolvedBy: { id: number; fullName: string } | null;
};

export type CameraDirection = 'ENTRY' | 'EXIT' | null;

export type GateCamera = {
  id: string;
  name: string;
  /** `removed`: quitada desde la app (soft delete); se puede restaurar. */
  status: 'connecting' | 'live' | 'offline' | 'ended' | 'removed';
  error: string | null;
  direction: CameraDirection;
  /** Video de prueba en bucle, no una cámara real. */
  test: boolean;
  frameWidth: number | null;
  frameHeight: number | null;
  lastPlate: { plate: string; at: string } | null;
  /** Rutas con permiso incluido, para `<img>` o `Image` (no mandan encabezados). Null si está quitada. */
  streamPath: string | null;
  framePath: string | null;
  removedAt: string | null;
  removedBy: string | null;
};

/** Un cambio hecho por portería: en una cámara o una lectura corregida. */
export type GateActivity =
  | {
      kind: 'camera';
      id: string;
      at: string;
      by: string | null;
      action: 'REMOVED' | 'RESTORED' | 'DIRECTION_CHANGED';
      cameraName: string;
      from: string | null;
      to: string | null;
    }
  | {
      kind: 'read';
      id: string;
      at: string;
      by: string | null;
      readId: number;
      plate: string;
      previousPlate: string | null;
      direction: 'ENTRY' | 'EXIT';
      previousDirection: 'ENTRY' | 'EXIT' | null;
      note: string | null;
    };

export type ReadCorrection = {
  direction?: 'ENTRY' | 'EXIT';
  licensePlateNumber?: string;
  note: string;
};

/** Recuadro de una placa en coordenadas de 0 a 1 sobre el cuadro. `plate` es null si aún no se lee. */
export type PlateBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  plate: string | null;
  confidence: number;
};

export type CameraDetections = {
  status: GateCamera['status'];
  seq: number;
  /** Antigüedad del último análisis: recuadros viejos no se dibujan. */
  ageMs: number | null;
  boxes: PlateBox[];
};

export type HolderInput = {
  fullName: string;
  identificationTypeId: number;
  identification: string;
};

export type HolderAccount = {
  id: number;
  fullName: string;
  role: { id: number; name: string } | null;
};

export type LiveFrameResult = {
  boxes: PlateBox[];
  /** Vehículos que ya terminaron de pasar frente a la cámara y quedaron registrados. */
  detections: Detection[];
};

/** La lectura de una foto del equipo puede tardar más la primera vez (carga los modelos). */
const LIVE_FRAME_TIMEOUT_MS = 30 * 1000;

export const gateService = {
  /** GET /app/gate/alerts */
  async alerts(): Promise<{ pending: GateAlert[]; resolvedToday: GateAlert[] }> {
    return request('/app/gate/alerts', { auth: true });
  },

  /** POST /app/gate/alerts/:id/visit */
  async allowVisit(id: number, note: string): Promise<GateAlert> {
    const response = await request<{ alert: GateAlert }>(`/app/gate/alerts/${id}/visit`, {
      method: 'POST',
      auth: true,
      body: { note },
    });
    return response.alert;
  },

  /** GET /app/gate/people — la cuenta de ENTRYX con ese documento, si existe. */
  async findPerson(
    identificationTypeId: number,
    identification: string,
  ): Promise<HolderAccount | null> {
    const query = new URLSearchParams({
      identificationTypeId: String(identificationTypeId),
      identification,
    });
    const response = await request<{ person: HolderAccount | null }>(
      `/app/gate/people?${query.toString()}`,
      {
        auth: true,
      },
    );
    return response.person;
  },

  /** POST /app/gate/vehicles — inscribe en portería; cierra la alerta de esa placa. */
  async registerVehicle(input: VehicleInput, holder: HolderInput, alertId?: number): Promise<void> {
    await request('/app/gate/vehicles', {
      method: 'POST',
      auth: true,
      body: { ...input, holder, ...(alertId ? { alertId } : {}) },
    });
  },

  /**
   * POST /app/gate/vehicles/link — la tarjeta es de un vehículo ya inscrito: la lectura de la
   * cámara queda asociada a él y la alerta se cierra.
   */
  async linkVehicle(
    licensePlateNumber: string,
    cameraPlate: string,
    alertId?: number,
  ): Promise<void> {
    await request('/app/gate/vehicles/link', {
      method: 'POST',
      auth: true,
      body: { licensePlateNumber, cameraPlate, ...(alertId ? { alertId } : {}) },
    });
  },

  /** GET /app/gate/cameras */
  async cameras(): Promise<GateCamera[]> {
    const response = await request<{ cameras: GateCamera[] }>('/app/gate/cameras', { auth: true });
    return response.cameras;
  },

  /** DELETE /app/gate/cameras/:id — soft delete: la detiene, pero se puede restaurar. */
  async removeCamera(cameraId: string): Promise<void> {
    await request(`/app/gate/cameras/${encodeURIComponent(cameraId)}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  /** POST /app/gate/cameras/:id/restore — la vuelve a encender. */
  async restoreCamera(cameraId: string): Promise<void> {
    await request(`/app/gate/cameras/${encodeURIComponent(cameraId)}/restore`, {
      method: 'POST',
      auth: true,
    });
  },

  /** PATCH /app/gate/cameras/:id — entrada, salida o automático (lo deduce el sistema). */
  async setCameraDirection(cameraId: string, direction: CameraDirection): Promise<void> {
    await request(`/app/gate/cameras/${encodeURIComponent(cameraId)}`, {
      method: 'PATCH',
      auth: true,
      body: { direction: direction ?? 'AUTO' },
    });
  },

  /** PATCH /app/gate/reads/:id — la original queda con soft delete; devuelve la nueva. */
  async correctRead(readId: number, correction: ReadCorrection): Promise<PlateRead> {
    const response = await request<{ read: PlateRead }>(`/app/gate/reads/${readId}`, {
      method: 'PATCH',
      auth: true,
      body: correction,
    });
    return response.read;
  },

  /** GET /app/gate/activity — cambios recientes de portería, con quién y cuándo. */
  async activity(): Promise<GateActivity[]> {
    const response = await request<{ activity: GateActivity[] }>('/app/gate/activity', {
      auth: true,
    });
    return response.activity;
  },

  /** GET /app/gate/cameras/:id/detections */
  async detections(cameraId: string): Promise<CameraDetections> {
    return request(`/app/gate/cameras/${encodeURIComponent(cameraId)}/detections`, { auth: true });
  },

  /** POST /app/gate/live/frame — una foto de la cámara de este equipo. */
  async liveFrame(
    frame: PickedFile,
    session: string,
    cameraName: string,
  ): Promise<LiveFrameResult> {
    const form = new FormData();
    appendFile(form, 'frame', frame);
    form.append('session', session);
    form.append('cameraName', cameraName);
    return request('/app/gate/live/frame', {
      method: 'POST',
      auth: true,
      body: form,
      timeoutMs: LIVE_FRAME_TIMEOUT_MS,
    });
  },

  /** POST /app/gate/live/close — registra lo que quedó a medio leer al cerrar la cámara. */
  async liveClose(session: string): Promise<Detection[]> {
    const response = await request<{ detections: Detection[] }>('/app/gate/live/close', {
      method: 'POST',
      auth: true,
      body: { session },
    });
    return response.detections;
  },
};
