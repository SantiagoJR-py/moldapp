import { request } from '@/lib/http';
import type { AlertStatus } from './gate.service';

export type PlateDirection = 'ENTRY' | 'EXIT';

export type PlateReadOwner = {
  id: number;
  fullName: string;
  urlImage: string | null;
  role: { id: number; name: string } | null;
};

export type PlateRead = {
  id: number;
  licensePlateNumber: string;
  /** `carro`, `moto` o null si la lectura no tiene formato colombiano. */
  vehicleType: 'carro' | 'moto' | null;
  direction: PlateDirection;
  cameraName: string;
  /** `CAMERA` (cámara real) o `UPLOAD` (foto o video subido para probar). */
  source: 'CAMERA' | 'UPLOAD';
  confidence: number;
  readsCount: number;
  corrections: number;
  plateWidthPx: number | null;
  imagePath: string | null;
  seenAt: string;
  vehicle: {
    id: number;
    licensePlateNumber: string;
    model: number;
    brand: { id: number; name: string | null } | null;
    version: { id: number; name: string | null } | null;
    owner: PlateReadOwner | null;
  } | null;
  /** Si la placa no estaba registrada: la alerta de portería y cómo se resolvió. */
  alert: {
    id: number;
    status: AlertStatus;
    resolutionNote: string | null;
    resolvedAt: string | null;
  } | null;
  /** Si portería la corrigió: la versión anterior (guardada con soft delete) y el motivo. */
  correctsId: number | null;
  corrects: { id: number; licensePlateNumber: string; direction: PlateDirection } | null;
  correctionNote: string | null;
  /** Quién la corrigió. Las lecturas de cámara no tienen autor. */
  creator: { id: number; fullName: string } | null;
};

export type PlateReadSummary = {
  inside: number;
  entriesToday: number;
  unregisteredToday: number;
  pendingAlerts: number;
};

type PlateReadsResponse = {
  ok: boolean;
  reads: PlateRead[];
  summary: PlateReadSummary;
  deletedIds: number[];
  serverTime: string;
};

export type PlateReadsPage = Omit<PlateReadsResponse, 'ok'>;

export const plateReadService = {
  /**
   * GET /app/plate-reads — con `afterId` trae solo las lecturas nuevas; con `deletedSince` (la
   * hora del servidor de la consulta anterior), también las que alguien corrigió desde entonces.
   */
  async list(afterId?: number, deletedSince?: string | null): Promise<PlateReadsPage> {
    const query = new URLSearchParams();
    if (afterId) query.set('afterId', String(afterId));
    if (deletedSince) query.set('deletedSince', deletedSince);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await request<PlateReadsResponse>(`/app/plate-reads${suffix}`, { auth: true });
    return {
      reads: response.reads,
      summary: response.summary,
      deletedIds: response.deletedIds ?? [],
      serverTime: response.serverTime,
    };
  },
};
