import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Isotype } from '@/components/brand/logo';
import { tabular } from '@/components/plates/styles';
import { palette, surface } from '@/constants/theme';
import { clockTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';

/** La hora se muestra en minutos: con revisarla cada pocos segundos no se queda atrás. */
const CLOCK_TICK_MS = 5000;

function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** "Lunes 26 de octubre": la fecha como se dice, sin la coma que agrega el formato. */
function longDate(time: number): string {
  const text = new Date(time)
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type HomeHeroProps = {
  firstName: string;
  /** Pantallas anchas: el reloj crece y la cabecera respira más. */
  wide?: boolean;
  /** Lo que va debajo del saludo: el estado del turno o la credencial. */
  children?: ReactNode;
};

/**
 * Cabecera de Inicio. Es el único lugar de la app donde la marca habla en grande: el reloj va en
 * Michroma, la fuente del logotipo, y los brazos de barrera del isotipo asoman desde el borde.
 */
export function HomeHero({ firstName, wide = false, children }: HomeHeroProps) {
  const now = useNow(CLOCK_TICK_MS);
  const [hours, minutes] = clockTime(now).split(':');

  return (
    <View style={[surface, { overflow: 'hidden', padding: wide ? 28 : 20 }]}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(47, 128, 237, 0.30)', 'rgba(47, 128, 237, 0.06)', 'rgba(47, 128, 237, 0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      {/* En el celular no cabe sin tapar el texto: el isotipo solo asoma en pantallas anchas. */}
      {wide ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', right: -48, bottom: -110, opacity: 0.06 }}
        >
          <Isotype size={280} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text className="text-sm text-steel-300">{longDate(now)}</Text>
          <Text
            className="font-bold tracking-tight text-steel-100"
            style={{ fontSize: wide ? 30 : 26, lineHeight: wide ? 36 : 32 }}
            numberOfLines={2}
          >
            {greeting(new Date(now).getHours())}, {firstName}
          </Text>
        </View>

        <Text
          accessibilityLabel={`Son las ${hours}:${minutes}`}
          style={[
            tabular,
            {
              fontFamily: 'Michroma_400Regular',
              fontSize: wide ? 40 : 24,
              lineHeight: wide ? 48 : 32,
              color: palette.steel100,
            },
          ]}
        >
          {hours}
          <Text style={{ color: palette.accent400 }}>:</Text>
          {minutes}
        </Text>
      </View>

      {children ? <View style={{ marginTop: wide ? 22 : 18 }}>{children}</View> : null}
    </View>
  );
}
