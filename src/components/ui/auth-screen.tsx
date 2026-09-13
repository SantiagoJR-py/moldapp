import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_FORM_WIDTH, palette } from '@/constants/theme';

type AuthScreenProps = {
  children: ReactNode;
};

/**
 * Fondo y contenedor comunes a las cuatro pantallas de autenticación.
 * En web el contenido se limita a `MAX_FORM_WIDTH` para no estirarse.
 */
export function AuthScreen({ children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-ink-950">
      <StatusBar style="light" />
      <LinearGradient
        colors={[palette.accent700, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, opacity: 0.18 }}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <View className="w-full self-center" style={{ maxWidth: MAX_FORM_WIDTH }}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type CardProps = {
  children: ReactNode;
};

export function Card({ children }: CardProps) {
  return (
    <View className="rounded-card border border-ink-600 bg-ink-900/90 p-6">{children}</View>
  );
}
