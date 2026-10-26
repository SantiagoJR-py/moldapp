import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { homeRouteFor } from '@/constants/navigation';
import { isGateRole } from '@/constants/roles';
import { useSession } from '@/context/session';

/**
 * Pantallas de portería (cámaras, alertas, historial, inscripción). Otro rol que llegue por la
 * URL vuelve a su inicio en vez de ver una pantalla llena de errores de permiso.
 */
export function GateOnly({ children }: { children: ReactNode }) {
  const { user } = useSession();

  if (!isGateRole(user?.role?.name)) {
    return <Redirect href={homeRouteFor(user?.role?.name)} />;
  }

  return <>{children}</>;
}
