import type { ScanResult } from '@/services/vehicle.service';

/** Qué pantalla abrió la cámara de la tarjeta: "Mis vehículos" o la inscripción en portería. */
export type ScanTarget = 'vehicles' | 'gate';

/**
 * Pasa el resultado del escaneo de la pantalla de cámara a la pantalla que la abrió. La cámara
 * vuelve atrás (no abre otra copia de esa pantalla) y la pantalla lo toma al montarse. Solo
 * viajan los datos leídos, nunca la foto, y se borran apenas se toman.
 */
const pending = new Map<ScanTarget, ScanResult>();

export function putScan(target: ScanTarget, result: ScanResult): void {
  pending.set(target, result);
}

/**
 * Lee sin borrar: el estado inicial de React puede calcularse dos veces en desarrollo y la
 * segunda vez no encontraría nada. Se borra después, con `clearScan`.
 */
export function peekScan(target: ScanTarget): ScanResult | undefined {
  return pending.get(target);
}

export function clearScan(target: ScanTarget): void {
  pending.delete(target);
}
