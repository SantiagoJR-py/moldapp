import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '@/constants/theme';

/**
 * Isotipo de ENTRYX: dos brazos de barrera cruzados en X.
 *
 * Se dibuja en SVG y no con el PNG de `assets/images/isotipo.png` por dos
 * razones: el PNG viene en RGB sin canal alfa (trae su propio fondo oscuro
 * incrustado, que no coincide con el de la app y dejaria un recuadro visible),
 * y en SVG el trazo escala nitido a cualquier tamano sin pesar 1 MB.
 *
 * Cada brazo se dibuja horizontal en su propio sistema de coordenadas y luego
 * se rota entero: asi las franjas quedan perpendiculares al brazo, como en una
 * barrera real, sin tener que calcular paralelogramos a mano.
 */

const ARM_LENGTH = 73.5;
const ARM_THICKNESS = 12.5;
const STRIPE = 9.2;

type ArmProps = {
  id: string;
  /** Punto de giro del brazo, que coincide con el centro del pivote. */
  x: number;
  y: number;
  angle: number;
};

function Arm({ id, x, y, angle }: ArmProps) {
  const half = ARM_THICKNESS / 2;

  // Franjas alternas a lo largo del brazo. La primera se salta para que el
  // arranque junto al pivote quede limpio.
  const stripes: { offset: number; color: string }[] = [];
  for (let i = 1; i * STRIPE < ARM_LENGTH; i += 1) {
    if (i % 2 === 0) continue;
    stripes.push({ offset: i * STRIPE, color: i % 4 === 1 ? palette.accent600 : palette.ink800 });
  }

  return (
    <G transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <Defs>
        <ClipPath id={id}>
          <Rect x={0} y={-half} width={ARM_LENGTH} height={ARM_THICKNESS} rx={half} />
        </ClipPath>
      </Defs>

      <Rect
        x={0}
        y={-half}
        width={ARM_LENGTH}
        height={ARM_THICKNESS}
        rx={half}
        fill={`url(#entryx-arm-${id})`}
      />

      <G clipPath={`url(#${id})`}>
        {stripes.map((stripe) => (
          <Rect
            key={stripe.offset}
            x={stripe.offset}
            y={-half}
            width={STRIPE}
            height={ARM_THICKNESS}
            fill={stripe.color}
          />
        ))}
      </G>
    </G>
  );
}

type IsotypeProps = {
  size?: number;
};

export function Isotype({ size = 56 }: IsotypeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Defs>
        <LinearGradient id="entryx-arm-arm-a" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.white} />
          <Stop offset="1" stopColor={palette.steel200} />
        </LinearGradient>
        <LinearGradient id="entryx-arm-arm-b" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.white} />
          <Stop offset="1" stopColor={palette.steel200} />
        </LinearGradient>
      </Defs>

      {/* Bases: los cajetines donde descansa cada brazo. Van primero para que
          el brazo entre por encima, como en una barrera real. */}
      <Rect x={13} y={58} width={23} height={31} rx={8} fill={palette.ink800} />
      <Rect x={60} y={58} width={23} height={31} rx={8} fill={palette.ink800} />
      <Rect x={23.5} y={67} width={2.5} height={14} rx={1.25} fill={palette.accent600} />
      <Rect x={70.5} y={67} width={2.5} height={14} rx={1.25} fill={palette.accent600} />

      <Arm id="arm-a" x={20} y={20} angle={45} />
      <Arm id="arm-b" x={76} y={20} angle={135} />

      {/* Pivotes, por encima de los brazos. */}
      <Circle cx={20} cy={20} r={10.5} fill={palette.ink800} />
      <Circle cx={20} cy={20} r={5} fill={palette.accent600} />
      <Circle cx={76} cy={20} r={10.5} fill={palette.ink800} />
      <Circle cx={76} cy={20} r={5} fill={palette.accent600} />
    </Svg>
  );
}

type AppMarkProps = {
  size?: number;
};

/** Isotipo dentro del cuadrado redondeado, como en el icono de la app. */
export function AppMark({ size = 72 }: AppMarkProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        borderCurve: 'continuous',
        backgroundColor: palette.ink900,
        borderWidth: 1,
        borderColor: palette.ink700,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.45)',
      }}
    >
      <Isotype size={size * 0.84} />
    </View>
  );
}

type WordmarkProps = {
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const WORDMARK_SIZE = {
  sm: { fontSize: 15, letterSpacing: 4 },
  md: { fontSize: 21, letterSpacing: 6 },
  lg: { fontSize: 28, letterSpacing: 8 },
} as const;

/**
 * El logotipo. Michroma es la unica fuente cargada de la app: la interfaz usa
 * la del sistema para sentirse nativa, y la display se reserva para la marca.
 */
export function Wordmark({ size = 'md', style }: WordmarkProps) {
  const { fontSize, letterSpacing } = WORDMARK_SIZE[size];

  return (
    <View style={style}>
      <Text style={{ fontFamily: 'Michroma_400Regular', fontSize, letterSpacing }}>
        <Text style={{ color: palette.steel100 }}>ENTRY</Text>
        <Text style={{ color: palette.accent400 }}>X</Text>
      </Text>
    </View>
  );
}

type BrandHeaderProps = {
  markSize?: number;
  tagline?: string;
};

export function BrandHeader({ markSize = 72, tagline }: BrandHeaderProps) {
  return (
    <View className="items-center gap-4">
      <AppMark size={markSize} />
      <Wordmark size="md" />
      {tagline ? <Text className="text-center text-sm text-steel-400">{tagline}</Text> : null}
    </View>
  );
}
