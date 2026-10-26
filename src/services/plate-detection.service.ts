import { request } from '@/lib/http';
import { appendFile, type PickedFile } from '@/lib/picked-file';
import type { PlateRead } from './plate-read.service';

/** Una placa encontrada en un archivo subido. `read` es lo que quedó guardado en el historial. */
export type Detection = {
  plate: string;
  vehicleType: 'carro' | 'moto' | null;
  confidence: number;
  corrections: number;
  plateWidthPx: number | null;
  /** Recorte de la placa como data URL JPEG. */
  crop: string | null;
  read: PlateRead | null;
};

export type DetectionJob = {
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  detections: Detection[];
  error: string | null;
};

/** Subir un video de 300 MB puede tardar; la respuesta llega apenas el servicio lo recibe. */
const VIDEO_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
/** La primera foto carga los modelos de detección en el servicio. */
const IMAGE_TIMEOUT_MS = 60 * 1000;

function formWith(file: PickedFile): FormData {
  const form = new FormData();
  appendFile(form, 'file', file);
  return form;
}

export const plateDetectionService = {
  /** POST /app/plate-detections/image */
  async uploadImage(file: PickedFile): Promise<Detection[]> {
    const response = await request<{ detections: Detection[] }>('/app/plate-detections/image', {
      method: 'POST',
      auth: true,
      body: formWith(file),
      timeoutMs: IMAGE_TIMEOUT_MS,
    });
    return response.detections;
  },

  /** POST /app/plate-detections/video — devuelve el id del trabajo. */
  async uploadVideo(file: PickedFile): Promise<string> {
    const response = await request<{ jobId: string }>('/app/plate-detections/video', {
      method: 'POST',
      auth: true,
      body: formWith(file),
      timeoutMs: VIDEO_UPLOAD_TIMEOUT_MS,
    });
    return response.jobId;
  },

  /** GET /app/plate-detections/jobs/:id */
  async job(id: string): Promise<DetectionJob> {
    const response = await request<{ job: DetectionJob }>(`/app/plate-detections/jobs/${id}`, {
      auth: true,
    });
    return response.job;
  },
};
