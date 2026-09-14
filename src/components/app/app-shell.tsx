import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, useWindowDimensions, View } from 'react-native';

import { SideMenu } from './side-menu';
import { TopBar } from './top-bar';

const DRAWER_WIDTH = 276;
/** A partir de este ancho el menú deja de flotar y queda fijo a la izquierda. */
const PERMANENT_MENU_BREAKPOINT = 1024;
/** Evita que las tarjetas se estiren de lado a lado en monitores anchos. */
const MAX_CONTENT_WIDTH = 860;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();
  const permanent = width >= PERMANENT_MENU_BREAKPOINT;

  const [open, setOpen] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  // Al cruzar el punto de quiebre el panel flotante deja de tener sentido.
  const [lastPermanent, setLastPermanent] = useState(permanent);
  if (permanent !== lastPermanent) {
    setLastPermanent(permanent);
    setOpen(false);
  }

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  return (
    <View className="flex-1 flex-row bg-ink-950">
      {permanent ? (
        <View style={{ width: DRAWER_WIDTH }}>
          <SideMenu />
        </View>
      ) : null}

      <View className="flex-1">
        <TopBar onOpenMenu={() => setOpen(true)} showMenuButton={!permanent} />
        <View className="w-full flex-1 self-center" style={{ maxWidth: MAX_CONTENT_WIDTH }}>
          {children}
        </View>
      </View>

      {!permanent && open ? (
        <>
          <Animated.View
            style={{ opacity: progress }}
            className="absolute bottom-0 left-0 right-0 top-0 bg-black/60"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              onPress={() => setOpen(false)}
              className="flex-1"
            />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: DRAWER_WIDTH,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-DRAWER_WIDTH, 0],
                  }),
                },
              ],
            }}
          >
            <SideMenu onClose={() => setOpen(false)} />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}
