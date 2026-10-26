import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScanIcon } from '@/components/ui/icons';
import { palette, radius } from '@/constants/theme';
import { DetectionOverlay } from './detection-overlay';
import type { DeviceCameraHandle, DeviceCameraProps } from './device-camera.types';

/** Borra la foto temporal: solo se usa para leer la placa, no se guarda. */
function discard(uri: string | null) {
  if (!uri) return;
  try {
    new File(uri).delete();
  } catch {
    // Si ya no existe, no hay nada que borrar.
  }
}

/** La cámara trasera del celular, como un lector de placas portátil. */
export const DeviceCamera = forwardRef<DeviceCameraHandle, DeviceCameraProps>(function DeviceCamera(
  { boxes, alerted },
  ref,
) {
  const camera = useRef<CameraView>(null);
  const last = useRef<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useImperativeHandle(ref, () => ({
    async capture() {
      if (!camera.current) return null;
      // La foto anterior ya se envió: se borra antes de tomar la siguiente.
      discard(last.current);
      const photo = await camera.current.takePictureAsync({ quality: 0.45, shutterSound: false });
      last.current = photo.uri;
      return { uri: photo.uri, name: 'cuadro.jpg', mimeType: 'image/jpeg', size: 0 };
    },
  }));

  useEffect(() => () => discard(last.current), []);

  if (!permission) {
    return (
      <Frame>
        <ActivityIndicator color={palette.accent400} />
      </Frame>
    );
  }

  if (!permission.granted) {
    return (
      <Frame>
        <View style={{ alignItems: 'center', gap: 12, padding: 24 }}>
          <ScanIcon size={32} color={palette.accent400} />
          <Text className="text-center text-base font-semibold text-steel-100">
            Permite usar la cámara
          </Text>
          <Text className="text-center text-sm leading-5 text-steel-400">
            La usamos para leer las placas de los vehículos que llegan. Las fotos no se guardan.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            {permission.canAskAgain ? (
              <Button label="Permitir cámara" onPress={() => void requestPermission()} />
            ) : (
              <Button label="Abrir ajustes" onPress={() => void Linking.openSettings()} />
            )}
          </View>
        </View>
      </Frame>
    );
  }

  return (
    <Frame>
      <CameraView
        ref={camera}
        style={{ position: 'absolute', inset: 0 }}
        facing="back"
        animateShutter={false}
      />
      <DetectionOverlay boxes={boxes} alerted={alerted} />
    </Frame>
  );
});

/** Proporción 3:4, la de la foto del celular: así los recuadros caen sobre la placa. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        aspectRatio: 3 / 4,
        maxHeight: 560,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: radius.card,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.ink700,
        backgroundColor: '#03070C',
      }}
    >
      {children}
    </View>
  );
}
