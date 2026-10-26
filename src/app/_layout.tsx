import '@/global.css';

import { Michroma_400Regular, useFonts } from '@expo-google-fonts/michroma';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { SessionProvider } from '@/context/session';

// La splash se mantiene hasta que la fuente de la marca este lista, para que el
// logotipo nunca aparezca primero con la tipografia del sistema y salte despues.
SplashScreen.preventAutoHideAsync().catch(() => {
  // En web no existe splash nativa; no es un error que valga la pena propagar.
});

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent500,
    background: palette.ink950,
    card: palette.ink900,
    text: palette.steel100,
    border: palette.ink700,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Michroma_400Regular });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Si la fuente falla se sigue adelante: la marca cae a la del sistema, pero
  // la app arranca igual en vez de quedarse en la splash para siempre.
  if (!ready) return null;

  return (
    // Necesario para que los gestos del cajon lateral funcionen en Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <SessionProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: palette.ink950 },
              }}
            />
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
