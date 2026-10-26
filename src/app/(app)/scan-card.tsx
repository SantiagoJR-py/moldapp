import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SurfaceGate } from '@/components/surface-gate';
import { Button } from '@/components/ui/button';
import { CameraIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { motion, palette, radius } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { ApiError } from '@/lib/http';
import { putScan } from '@/lib/scan-store';
import { vehicleService } from '@/services/vehicle.service';

/** Proporción de una tarjeta ID-1 (85,6 x 54 mm), la de la licencia de tránsito. */
const CARD_RATIO = 85.6 / 54;
const MASK = 'rgba(8, 12, 18, 0.66)';

const UNREADABLE =
  'No pudimos leer la tarjeta. Tómala de frente, sin reflejos y con toda la tarjeta dentro del marco.';
const OFFLINE =
  'El servicio de lectura no está disponible en este equipo. Puedes llenar los datos a mano.';

export default function ScanCardRoute() {
  return (
    <SurfaceGate only="mobile">
      <ScanCardScreen />
    </SurfaceGate>
  );
}

/** Borra la foto temporal que deja la cámara: la tarjeta no se guarda en ningún lado. */
function discard(uri: string) {
  try {
    new File(uri).delete();
  } catch {
    // Si ya no existe, no hay nada que borrar.
  }
}

function ScanCardScreen() {
  const insets = useSafeAreaInsets();
  // Portería la abre desde la inscripción en la entrada; el resto, desde "Mis vehículos".
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const target = returnTo === 'gate' ? 'gate' : 'vehicles';
  const { width, height } = useWindowDimensions();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const frameWidth = Math.min(width * 0.86, 520);
  const frameHeight = frameWidth / CARD_RATIO;
  const frameTop = Math.max((height - frameHeight) / 2 - 80, 120);

  async function capture() {
    if (!camera.current || reading) return;
    setProblem(null);
    setReading(true);

    let uri: string | null = null;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85, shutterSound: false });
      uri = photo.uri;
      const result = await vehicleService.scanCard({
        uri,
        name: 'tarjeta.jpg',
        mimeType: 'image/jpeg',
        size: 0,
      });

      if (!result.readable) {
        setProblem(UNREADABLE);
        return;
      }
      // Vuelve a la pantalla que la abrió (con su alerta y lo ya escrito), que toma el resultado.
      putScan(target, result);
      if (router.canGoBack()) router.back();
      else router.replace(target === 'gate' ? '/gate-register' : '/vehicles');
    } catch (error) {
      setProblem(
        error instanceof ApiError && error.status === 503
          ? OFFLINE
          : apiMessage(error, 'No pudimos leer la tarjeta. Intenta de nuevo.'),
      );
    } finally {
      if (uri) discard(uri);
      setReading(false);
    }
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={palette.accent400} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center gap-5 p-6">
        <CameraIcon size={36} color={palette.accent400} />
        <Text className="text-2xl font-bold tracking-tight text-steel-100">
          Permite usar la cámara
        </Text>
        <Text className="text-sm leading-5 text-steel-400">
          La usamos solo para leer la tarjeta de propiedad y llenar los datos del vehículo. La foto
          no se guarda.
        </Text>
        {permission.canAskAgain ? (
          <Button label="Permitir cámara" onPress={() => void requestPermission()} />
        ) : (
          <Button label="Abrir ajustes" onPress={() => void Linking.openSettings()} />
        )}
        <Button label="Llenar a mano" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: palette.ink950 }}>
      <CameraView ref={camera} style={{ flex: 1 }} facing="back" />

      {/* Máscara oscura alrededor del marco: el ojo va directo a donde va la tarjeta. */}
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
        <View style={{ height: frameTop, backgroundColor: MASK }} />
        <View style={{ flexDirection: 'row', height: frameHeight }}>
          <View style={{ flex: 1, backgroundColor: MASK }} />
          <View
            style={{
              width: frameWidth,
              borderRadius: 14,
              borderCurve: 'continuous',
              borderWidth: 2,
              borderColor: reading ? palette.accent400 : 'rgba(255, 255, 255, 0.92)',
            }}
          />
          <View style={{ flex: 1, backgroundColor: MASK }} />
        </View>
        <View style={{ flex: 1, backgroundColor: MASK }} />
      </View>

      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 24, right: 24, top: frameTop - 76, gap: 4 }}
      >
        <Text className="text-center text-lg font-semibold text-white">
          Ubica la tarjeta de propiedad dentro del marco
        </Text>
        <Text className="text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
          De frente, con buena luz y sin reflejos
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          gap: 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {problem ? (
          <Animated.View
            entering={FadeInDown.duration(motion.base).springify().damping(22)}
            exiting={FadeOut.duration(motion.fast)}
            style={{
              gap: 12,
              borderRadius: radius.card,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: 'rgba(251, 113, 133, 0.38)',
              backgroundColor: palette.ink900,
              padding: 16,
            }}
          >
            <Text className="text-sm leading-5 text-steel-200">{problem}</Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button label="Intentar de nuevo" onPress={() => setProblem(null)} />
              </View>
              <View className="flex-1">
                <Button label="Llenar a mano" variant="outline" onPress={() => router.back()} />
              </View>
            </View>
          </Animated.View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <PressableScale
            accessibilityLabel="Cancelar"
            onPress={() => router.back()}
            style={{ width: 88 }}
          >
            <Text className="text-base text-white">Cancelar</Text>
          </PressableScale>

          <PressableScale
            accessibilityLabel="Tomar foto de la tarjeta"
            disabled={reading || problem !== null}
            depth={0.92}
            onPress={() => void capture()}
            style={{
              height: 76,
              width: 76,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              borderWidth: 4,
              borderColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {reading ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <View
                style={{
                  height: 58,
                  width: 58,
                  borderRadius: radius.pill,
                  backgroundColor: palette.white,
                }}
              />
            )}
          </PressableScale>

          <View style={{ width: 88 }} />
        </View>
      </View>

      {reading ? (
        <Animated.View
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: frameTop + frameHeight + 20 }}
        >
          <Text className="text-center text-base font-semibold text-white">Leyendo tarjeta…</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
