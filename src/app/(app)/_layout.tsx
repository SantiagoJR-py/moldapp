import { Redirect, Slot, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppShell } from '@/components/app/app-shell';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { motion } from '@/constants/theme';
import { GateAlertsProvider } from '@/context/gate-alerts';
import { useSession } from '@/context/session';
import { entryRoute } from '@/lib/surface';

export default function AppLayout() {
  const { user, loading, refreshProfile } = useSession();
  const pathname = usePathname();
  const refreshed = useRef(false);

  // El usuario guardado puede estar desactualizado (rol, foto, estado). La sesión
  // se lee del disco de forma asíncrona, así que hay que esperar a que llegue.
  useEffect(() => {
    if (loading || !user || refreshed.current) return;

    refreshed.current = true;
    void refreshProfile();
  }, [loading, user, refreshProfile]);

  if (loading) {
    return <LoadingScreen message="Comprobando tu sesión…" />;
  }

  if (!user) {
    return <Redirect href={entryRoute} />;
  }

  return (
    <GateAlertsProvider>
      <AppShell>
        {/*
        La navegación de esta zona es el cajón lateral, no una pila, así que
        `Slot` cambia el contenido de golpe y sin transición. La clave por ruta
        hace que cada pantalla se monte de nuevo y entre con un fundido: el
        salto seco es de lo que más delata a una app que no está terminada.
      */}
        <Animated.View key={pathname} entering={FadeIn.duration(motion.base)} style={{ flex: 1 }}>
          <Slot />
        </Animated.View>
      </AppShell>
    </GateAlertsProvider>
  );
}
