import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { homeRouteFor } from '@/constants/navigation';
import { RoleName } from '@/constants/roles';
import { useSession } from '@/context/session';

/** Pantallas de Administración. Otro rol que llegue por la URL vuelve a su inicio. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useSession();

  if (user?.role?.name !== RoleName.ADMINISTRATIVE_STAFF) {
    return <Redirect href={homeRouteFor(user?.role?.name)} />;
  }

  return <>{children}</>;
}
