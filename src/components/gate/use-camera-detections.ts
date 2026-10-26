import { useEffect, useState } from 'react';

import { gateService, type PlateBox } from '@/services/gate.service';

/** El servicio analiza unos 5 cuadros por segundo; pedir más seguido no aporta. */
const POLL_MS = 350;
/** Un recuadro más viejo que esto ya no corresponde a lo que se ve. */
const STALE_MS = 1500;

/** Recuadros de las placas que la cámara está viendo, para dibujarlos encima del video. */
export function useCameraDetections(cameraId: string, active: boolean): PlateBox[] {
  const [boxes, setBoxes] = useState<PlateBox[]>([]);

  useEffect(() => {
    if (!active) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const result = await gateService.detections(cameraId);
        if (!alive) return;
        const fresh = result.ageMs !== null && result.ageMs < STALE_MS;
        setBoxes(fresh ? result.boxes : []);
      } catch {
        if (alive) setBoxes([]);
      }
      if (alive) timer = setTimeout(() => void tick(), POLL_MS);
    }

    void tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [cameraId, active]);

  return active ? boxes : [];
}
