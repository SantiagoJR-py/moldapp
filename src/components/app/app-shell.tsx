import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { AlertStrip } from '@/components/gate/alert-strip';
import { AlertTakeover } from '@/components/gate/alert-takeover';
import {
  MAX_CONTENT_WIDTH,
  PERMANENT_MENU_BREAKPOINT,
  SIDE_MENU_WIDTH,
  WIDE_CONTENT_WIDTH,
} from '@/lib/layout';
import { SideMenu } from './side-menu';
import { TabBar } from './tab-bar';
import { TopBar } from './top-bar';

/** Pantallas de cámara a pantalla completa: sin barras alrededor. */
const IMMERSIVE = ['/scan-card'];

/** El monitor de cámaras aprovecha todo el ancho del PC de la caseta. */
const WIDE_ROUTES = ['/monitor'];

type AppShellProps = {
  children: ReactNode;
};

/**
 * Celular: barra superior, contenido y pestañas abajo, como una app de iPhone.
 * PC: menú fijo a la izquierda. En los dos, la alerta de vehículo sin registrar va encima.
 */
export function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const permanent = width >= PERMANENT_MENU_BREAKPOINT;

  if (IMMERSIVE.includes(pathname)) {
    return (
      <View className="flex-1 bg-ink-950">
        {children}
        <AlertTakeover />
      </View>
    );
  }

  const maxWidth = WIDE_ROUTES.includes(pathname) ? WIDE_CONTENT_WIDTH : MAX_CONTENT_WIDTH;

  return (
    <View className="flex-1 flex-row bg-ink-950">
      {permanent ? (
        <View style={{ width: SIDE_MENU_WIDTH }}>
          <SideMenu />
        </View>
      ) : null}

      <View className="flex-1">
        {permanent ? null : <TopBar />}
        <AlertStrip />
        <View className="w-full flex-1 self-center" style={{ maxWidth }}>
          {children}
        </View>
        {permanent ? null : <TabBar />}
      </View>

      <AlertTakeover />
    </View>
  );
}
