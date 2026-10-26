import { Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { tabular } from './styles';

/**
 * Amarillo de la placa particular colombiana. No es un color de la marca: es el
 * del objeto real, y es lo que hace que el vigilante reconozca la placa al vuelo.
 */
export const PLATE_YELLOW = '#F2C21B';

/** La placa dibujada como el objeto real: así se reconoce antes de leerla. */
type PlateChipProps = {
  plate: string;
  colombian: boolean;
  /** `sm` para listas compactas; `lg` para la alerta, que se lee desde lejos. */
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: { fontSize: 13, letterSpacing: 1, paddingHorizontal: 6, paddingVertical: 1, frame: 2.5 },
  md: { fontSize: 18, letterSpacing: 1.6, paddingHorizontal: 9, paddingVertical: 2, frame: 2.5 },
  lg: { fontSize: 34, letterSpacing: 3, paddingHorizontal: 16, paddingVertical: 4, frame: 4 },
} as const;

export function PlateChip({ plate, colombian, size = 'md' }: PlateChipProps) {
  const metrics = SIZES[size];

  // Las placas colombianas separan letras y números: ABC 123, ABC 12D.
  const text = colombian && plate.length >= 5 ? `${plate.slice(0, 3)} ${plate.slice(3)}` : plate;

  return (
    <View
      accessibilityLabel={`Placa ${plate.split('').join(' ')}`}
      style={{
        borderRadius: size === 'lg' ? 11 : 7,
        borderCurve: 'continuous',
        backgroundColor: colombian ? PLATE_YELLOW : palette.steel100,
        padding: metrics.frame,
      }}
    >
      <View
        style={{
          borderRadius: size === 'lg' ? 8 : 5,
          borderCurve: 'continuous',
          borderWidth: size === 'lg' ? 2.5 : 1.5,
          borderColor: 'rgba(8, 12, 18, 0.82)',
          paddingHorizontal: metrics.paddingHorizontal,
          paddingVertical: metrics.paddingVertical,
        }}
      >
        <Text
          style={[
            tabular,
            {
              color: palette.ink950,
              fontSize: metrics.fontSize,
              fontWeight: '800',
              letterSpacing: metrics.letterSpacing,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
