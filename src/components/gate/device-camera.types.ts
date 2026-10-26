import type { PickedFile } from '@/lib/picked-file';
import type { PlateBox } from '@/services/gate.service';

export type DeviceCameraHandle = {
  /** Toma una foto para analizar. null si la cámara todavía no está lista. */
  capture: () => Promise<PickedFile | null>;
};

export type DeviceCameraProps = {
  /** Recuadros de la última foto analizada. */
  boxes: PlateBox[];
  alerted?: ReadonlySet<string>;
};
