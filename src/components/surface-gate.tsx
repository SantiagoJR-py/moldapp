import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { entryRoute, isSurfaceAllowed, type Surface } from '@/lib/surface';

type SurfaceGateProps = {
  only: Surface;
  children: ReactNode;
};

/** Redirige a la pantalla de entrada si la ruta no pertenece a esta plataforma. */
export function SurfaceGate({ only, children }: SurfaceGateProps) {
  if (!isSurfaceAllowed(only)) {
    return <Redirect href={entryRoute} />;
  }

  return <>{children}</>;
}
