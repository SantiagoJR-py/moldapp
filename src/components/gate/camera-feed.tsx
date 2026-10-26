import { Image } from 'expo-image';
import { useState } from 'react';

import { resolveImageUrl } from '@/lib/images';
import type { CameraFeedProps } from './camera-feed.types';

/** Unos 4 cuadros por segundo: fluido para ver quién llega, liviano para el Wi-Fi de la caseta. */
const FRAME_MS = 250;
const RETRY_MS = 1500;

/**
 * En el celular el video MJPEG no se puede mostrar, así que se piden cuadros seguidos. Cada
 * cuadro se pide apenas termina de cargar el anterior, y `expo-image` mantiene el que se ve
 * hasta que llega el siguiente: no parpadea.
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
    <Image
      source={{ uri: `${base}&t=${frame}` }}
      cachePolicy="none"
      contentFit="contain"
      transition={0}
      accessibilityLabel={`Video en vivo de ${camera.name}`}
      onLoad={() => next(FRAME_MS)}
      onError={() => next(RETRY_MS)}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
    />
  );
}
