import { Redirect, Slot } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppShell } from '@/components/app/app-shell';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { entryRoute } from '@/lib/surface';

export default function AppLayout() {
  const { user, loading, refreshProfile } = useSession();
  const refreshed = useRef(false);

  // El usuario guardado puede estar desactualizado (rol, foto, estado). La sesión
  // se lee del disco de forma asíncrona, así que hay que esperar a que llegue.
  useEffect(() => {
    if (loading || !user || refreshed.current) return;

    refreshed.current = true;
    void refreshProfile();
  }, [loading, user, refreshProfile]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-950">
        <ActivityIndicator color={palette.accent400} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href={entryRoute} />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
