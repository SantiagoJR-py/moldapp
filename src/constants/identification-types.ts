/**
 * Refleja `src/seeders/identification-type.seeder.ts` de moldapp-back en el mismo orden
 * en que se insertan. Reemplazar por un `GET /app/identification-types` cuando exista.
 */
export const IDENTIFICATION_TYPES = [
  { id: 1, name: 'Cédula de Ciudadanía', short: 'CC' },
  { id: 2, name: 'Cédula de Extranjería', short: 'CE' },
  { id: 3, name: 'Tarjeta de Identidad', short: 'TI' },
  { id: 4, name: 'NIT', short: 'NIT' },
  { id: 5, name: 'Pasaporte', short: 'PA' },
  { id: 6, name: 'Permiso por Protección Temporal', short: 'PPT' },
] as const;

export type IdentificationType = (typeof IDENTIFICATION_TYPES)[number];
