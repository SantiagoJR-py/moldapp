import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PLATE_YELLOW } from '@/components/plates/plate-chip';
import { tabular } from '@/components/plates/styles';
import { motion, palette } from '@/constants/theme';
import type { PlateBox } from '@/services/gate.service';

type DetectionOverlayProps = {
  boxes: PlateBox[];
  /** Placas con alerta pendiente: se marcan en rojo para que el vigilante las vea al instante. */
  alerted?: ReadonlySet<string>;
};

/**
 * Recuadros sobre el video, en coordenadas de 0 a 1 del cuadro. El contenedor debe tener la
 * misma proporción que el video para que caigan justo sobre la placa.
 */
export function DetectionOverlay({ boxes, alerted }: DetectionOverlayProps) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {boxes.map((box, index) => {
        const reading = box.plate === null;
        const flagged = box.plate !== null && Boolean(alerted?.has(box.plate));
        const color = flagged
          ? palette.danger
          : reading
            ? 'rgba(241, 245, 249, 0.7)'
            : palette.accent400;

        return (
          <Animated.View
            key={`${box.plate ?? 'leyendo'}-${index}`}
            entering={FadeIn.duration(motion.fast)}
            exiting={FadeOut.duration(motion.fast)}
            style={{
              position: 'absolute',
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.w * 100}%`,
              height: `${box.h * 100}%`,
              minWidth: 14,
              minHeight: 8,
              borderRadius: 4,
              borderWidth: 2,
              borderStyle: reading ? 'dashed' : 'solid',
              borderColor: color,
            }}
          >
            {box.plate ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: -2,
                  marginBottom: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <View
                  style={{
                    borderRadius: 4,
                    backgroundColor: flagged ? palette.danger : PLATE_YELLOW,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                  }}
                >
                  <Text
                    style={[
                      tabular,
                      { color: palette.ink950, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
                    ]}
                  >
                    {box.plate}
                  </Text>
                </View>
                {flagged ? (
                  <View
                    style={{
                      borderRadius: 4,
                      backgroundColor: 'rgba(8, 12, 18, 0.82)',
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                    }}
                  >
                    <Text style={{ color: palette.danger, fontSize: 11, fontWeight: '700' }}>
                      SIN REGISTRAR
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}
