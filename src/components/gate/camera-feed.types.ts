import type { GateCamera } from '@/services/gate.service';

export type CameraFeedProps = {
  camera: GateCamera;
  /** Fuera de pantalla o con la cámara caída no se piden cuadros. */
  active: boolean;
};
