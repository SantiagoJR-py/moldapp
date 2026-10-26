/**
 * Formatos colombianos. Espejo de `moldapp-back/src/constants/vehicle.ts` y de
 * `entryx-lpr/entryx_lpr/plates.py`: si cambias uno, cambia los tres.
 */

/** Carro ABC123 · moto ABC12D · moto antigua ABC12. */
export const COLOMBIAN_PLATE = /^([A-Z]{3}\d{3}|[A-Z]{3}\d{2}[A-Z]?)$/;

export function isColombianPlate(plate: string): boolean {
  return COLOMBIAN_PLATE.test(plate);
}

/** Clases de vehículo tal como las escribe la licencia de tránsito. */
export const VEHICLE_CLASSES = [
  'AUTOMÓVIL',
  'CAMIONETA',
  'CAMPERO',
  'MOTOCICLETA',
  'MOTOCARRO',
  'CUATRIMOTO',
  'MICROBÚS',
  'BUS',
  'CAMIÓN',
  'VOLQUETA',
  'TRACTOCAMIÓN',
] as const;
