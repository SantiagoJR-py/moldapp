import { useState } from 'react';

import { resolveImageUrl } from '@/lib/images';
import type { CameraFeedProps } from './camera-feed.types';

/** Unos 8 cuadros por segundo: fluido en el monitor de la caseta. */
const FRAME_MS = 120;
const RETRY_MS = 1500;

/**
 * En el navegador también se piden cuadros seguidos en vez de abrir el video MJPEG. Un MJPEG
 * deja una conexión abierta por cámara y Chrome solo abre seis por servidor: con varias
 * cámaras, las alertas y el historial quedaban en cola. El navegador mantiene el cuadro que
 * se ve hasta que carga el siguiente, así que no parpadea.
 */
export function CameraFeed({ camera, active }: CameraFeedProps) {
  const [frame, setFrame] = useState(0);
  const base = resolveImageUrl(camera.framePath);

  // Sin `active` no se monta: al volver, la imagen nueva carga y la cadena arranca sola.
  if (!base || !active) return null;

  function next(delay: number) {
    setTimeout(() => setFrame((current) => current + 1), delay);
  }

  return (
    <img
      src={`${base}&t=${frame}`}
      alt={`Video en vivo de ${camera.name}`}
      draggable={false}
      onLoad={() => next(FRAME_MS)}
      onError={() => next(RETRY_MS)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        userSelect: 'none',
      }}
    />
  );
}
