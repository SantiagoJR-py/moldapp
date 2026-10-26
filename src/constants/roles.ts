/** Espejo de `RoleName` en `moldapp-back/src/constants/auth.ts`. */
export const RoleName = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
  ADMINISTRATIVE_STAFF: 'ADMINISTRATIVE_STAFF',
  WARDEN: 'WARDEN',
  EXTERNAL_PERSONS: 'EXTERNAL_PERSONS',
} as const;

export type RoleNameValue = (typeof RoleName)[keyof typeof RoleName];

const ROLE_LABELS: Record<string, string> = {
  [RoleName.STUDENT]: 'Estudiante',
  [RoleName.TEACHER]: 'Docente',
  [RoleName.STAFF]: 'Personal',
  [RoleName.ADMINISTRATIVE_STAFF]: 'Personal administrativo',
  [RoleName.WARDEN]: 'Portería',
  [RoleName.EXTERNAL_PERSONS]: 'Persona externa',
};

/** Portería y Administración: ven las cámaras, las alertas y el historial de accesos. */
export function isGateRole(name: string | undefined): boolean {
  return name === RoleName.WARDEN || name === RoleName.ADMINISTRATIVE_STAFF;
}

export function roleLabel(name: string | undefined): string {
  if (!name) return 'Sin rol';
  return ROLE_LABELS[name] ?? name;
}
