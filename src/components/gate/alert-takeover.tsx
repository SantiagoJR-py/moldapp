import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlateChip } from '@/components/plates/plate-chip';
import { tabular } from '@/components/plates/styles';
import { Button, LinkButton } from '@/components/ui/button';
import { AlertIcon, CameraIcon } from '@/components/ui/icons';
import { motion, palette, radius } from '@/constants/theme';
import { isColombianPlate } from '@/constants/vehicle';
import { useGateAlerts } from '@/context/gate-alerts';
import { resolveImageUrl } from '@/lib/images';
import { stillMotion } from '@/lib/motion';
import { clockTime } from '@/lib/time';

/** Mientras se inscribe un vehículo o se toma la foto de la tarjeta solo suena: tapar el
 *  formulario a mitad de camino haría perder lo escrito. Aparece apenas se sale. */
const HOLD_ON = ['/gate-register', '/scan-card'];

/**
 * La alerta que manda sobre todo: un vehículo sin registrar acaba de entrar. Tapa la pantalla
 * (en cualquier sección), suena y vibra, y solo se aparta cuando la persona elige qué hacer.
 * "Ver después" no la descarta: queda pendiente en la franja roja hasta resolverla.
 */
export function AlertTakeover() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { incoming, queued, dismissIncoming } = useGateAlerts();
  const reduceMotion = useReducedMotion();
  const glow = useSharedValue(0.35);

  useEffect(() => {
    if (!incoming || reduceMotion) return;
    glow.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [incoming, reduceMotion, glow]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  if (!incoming || HOLD_ON.includes(pathname)) return null;

  const alert = incoming;
  const image = resolveImageUrl(alert.imagePath);
  const repeated = alert.readsCount > 1;

  function register() {
    dismissIncoming();
    router.push({
      pathname: '/gate-register',
      params: { alertId: String(alert.id), plate: alert.licensePlateNumber },
    });
  }

  function visit() {
    dismissIncoming();
    router.navigate({ pathname: '/alerts', params: { visit: String(alert.id) } });
  }

  return (
    <Animated.View
      entering={FadeIn.duration(motion.fast)}
      exiting={FadeOut.duration(motion.base)}
      accessibilityViewIsModal
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(3, 7, 12, 0.82)',
      }}
    >
      {/* En pantallas bajas la tarjeta no cabe: se desplaza en vez de cortarse arriba. */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={alert.id}
          entering={
            stillMotion || reduceMotion
              ? FadeIn.duration(motion.base)
              : SlideInUp.duration(motion.slow)
          }
          exiting={
            stillMotion || reduceMotion
              ? FadeOut.duration(motion.fast)
              : SlideOutUp.duration(motion.base)
          }
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={{ width: '100%', maxWidth: 460, alignSelf: 'center' }}
        >
          {/* Halo que late: el ojo lo encuentra aunque la persona esté mirando la calle. */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                inset: -6,
                borderRadius: radius.sheet + 6,
                borderCurve: 'continuous',
                borderWidth: 2,
                borderColor: palette.danger,
              },
              ringStyle,
            ]}
          />

          <View
            style={{
              overflow: 'hidden',
              borderRadius: radius.sheet,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: 'rgba(251, 113, 133, 0.55)',
              backgroundColor: palette.ink800,
              boxShadow: '0px 24px 64px rgba(0, 0, 0, 0.6)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: palette.danger,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              <AlertIcon size={20} color={palette.ink950} />
              <Text className="flex-1 text-base font-bold text-ink-950">
                Vehículo sin registrar
              </Text>
              <Text className="text-base font-semibold text-ink-950" style={tabular}>
                {clockTime(new Date(alert.lastSeenAt).getTime())}
              </Text>
            </View>

            <View style={{ gap: 18, padding: 20 }}>
              <View style={{ alignItems: 'center', gap: 14 }}>
                <PlateChip
                  plate={alert.licensePlateNumber}
                  colombian={isColombianPlate(alert.licensePlateNumber)}
                  size="lg"
                />
                {image ? (
                  <Image
                    source={{ uri: image }}
                    contentFit="contain"
                    accessibilityLabel={`Foto de la placa ${alert.licensePlateNumber}`}
                    style={{
                      height: 84,
                      width: '100%',
                      borderRadius: radius.field,
                      backgroundColor: palette.ink950,
                    }}
                  />
                ) : null}
              </View>

              <View style={{ gap: 6 }}>
                <View className="flex-row items-center gap-2">
                  <CameraIcon size={16} color={palette.steel400} />
                  <Text className="flex-1 text-base text-steel-100">
                    Entró por <Text className="font-semibold">{alert.cameraName}</Text>
                  </Text>
                </View>
                <Text className="text-sm leading-5 text-steel-300">
                  {repeated
                    ? `Ya entró ${alert.readsCount} veces sin estar inscrito. Inscríbelo con su tarjeta de propiedad.`
                    : 'No está inscrito en ENTRYX. Pide la tarjeta de propiedad para inscribirlo.'}
                </Text>
                {alert.source === 'UPLOAD' ? (
                  <Text className="text-xs text-accent-300">
                    Lectura de prueba (video o archivo).
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: 10 }}>
                <Button label="Inscribir con tarjeta de propiedad" onPress={register} />
                <Button label="Dejar pasar como visita" variant="outline" onPress={visit} />
                <View style={{ paddingTop: 4 }}>
                  <LinkButton
                    label={queued > 0 ? `Ver después · ${queued} más en Alertas` : 'Ver después'}
                    onPress={dismissIncoming}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}
