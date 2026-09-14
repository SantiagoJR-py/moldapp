import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { routes } from '@/lib/routes';
import { entryRoute } from '@/lib/surface';

function SessionSpinner() {
  return (
    <View className="flex-1 items-center justify-center bg-ink-950">
      <ActivityIndicator color={palette.accent400} />
    </View>
  );
}

type GateProps = {
  children: ReactNode;
};

/**
 * Equivalente a un AuthGuard de Angular: solo deja pasar si hay sesión.
 * Si no, manda a la pantalla de entrada de la plataforma (login o registro).
 */
export function AuthGate({ children }: GateProps) {
  const { user, loading } = useSession();

  if (loading) return <SessionSpinner />;
  if (!user) return <Redirect href={entryRoute} />;

  return <>{children}</>;
}

/**
 * Equivalente a un GuestGuard: login/registro/recuperación.
 * Si ya hay sesión, manda al panel `/admin`.
 */
export function GuestGate({ children }: GateProps) {
  const { user, loading } = useSession();

  if (loading) return <SessionSpinner />;
  if (user) return <Redirect href={routes.adminHome} />;

  return <>{children}</>;
}
