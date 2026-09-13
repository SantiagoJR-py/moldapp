import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { SessionProvider } from '@/context/session';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent500,
    background: palette.ink950,
    card: palette.ink900,
    text: palette.steel100,
    border: palette.steel700,
  },
};

export default function RootLayout() {
  return (
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
  );
}
