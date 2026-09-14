import { Slot } from 'expo-router';
import { useEffect, useRef } from 'react';

import { AppShell } from '@/components/app/app-shell';
import { AuthGate } from '@/components/auth-gate';
import { useSession } from '@/context/session';

/**
 * Zona administrativa (`/admin/*`): requiere sesión.
 * El shell (menú + top bar) solo aparece aquí, no en login/registro.
 */
export default function AdminLayout() {
  return (
    <AuthGate>
      <AdminShell />
    </AuthGate>
  );
}

function AdminShell() {
  const { user, refreshProfile } = useSession();
  const refreshed = useRef(false);

  useEffect(() => {
    if (!user || refreshed.current) return;

    refreshed.current = true;
    void refreshProfile();
  }, [user, refreshProfile]);

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
