import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_FORM_WIDTH, motion, palette, radius, shadows } from '@/constants/theme';
import { ShaderBackground } from './shader-background';

type AuthScreenProps = {
  children: ReactNode;
};

/**
 * Fondo y contenedor comunes a las cuatro pantallas de autenticacion.
 *
 * El shader ocupa la mitad superior y se funde con el obsidiana mediante un
 * degradado: asi la marca se apoya en algo vivo sin que el formulario compita
 * con el movimiento detras. Se deja fuera de la zona privada a proposito
 * porque es lo mas caro de dibujar de toda la app.
 */
export function AuthScreen({ children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-ink-950">
      <StatusBar style="light" />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '58%' }}>
        <ShaderBackground intensity={0.19} />
        {/* Difumina el borde inferior del shader contra el fondo de la app. */}
        <LinearGradient
          colors={['transparent', 'rgba(8,12,18,0.72)', palette.ink950]}
          locations={[0, 0.62, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            pointerEvents: 'none',
          }}
        />
      </View>

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
            paddingHorizontal: 20,
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <Animated.View
            entering={FadeIn.duration(motion.slow)}
            style={{ width: '100%', alignSelf: 'center', maxWidth: MAX_FORM_WIDTH }}
          >
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type CardProps = {
  children: ReactNode;
};

/** Tarjeta de vidrio: borde fino, fondo casi opaco y sombra de elevacion. */
export function Card({ children }: CardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.slow).springify().damping(18)}
      style={{
        borderRadius: radius.card,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.ink700,
        backgroundColor: 'rgba(13, 27, 42, 0.92)',
        padding: 24,
        boxShadow: shadows.overlay,
      }}
    >
      {children}
    </Animated.View>
  );
}
