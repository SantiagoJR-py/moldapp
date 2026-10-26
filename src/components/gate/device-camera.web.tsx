import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScanIcon } from '@/components/ui/icons';
import { palette, radius } from '@/constants/theme';
import { DetectionOverlay } from './detection-overlay';
import type { DeviceCameraHandle, DeviceCameraProps } from './device-camera.types';

/** Suficiente para leer una placa a unos metros; más grande solo pesa más en la red. */
const CAPTURE_MAX_WIDTH = 1280;

type CameraState =
  { phase: 'starting' } | { phase: 'ready'; ratio: number } | { phase: 'error'; message: string };

function cameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError') {
    return 'El navegador no tiene permiso para usar la cámara. Permítelo en el candado de la barra de direcciones.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Este equipo no tiene una cámara conectada.';
  }
  if (name === 'NotReadableError') return 'Otra aplicación está usando la cámara.';
  return 'No pudimos abrir la cámara de este equipo.';
}

/** La webcam del PC de portería (o la cámara del navegador del celular). */
export const DeviceCamera = forwardRef<DeviceCameraHandle, DeviceCameraProps>(function DeviceCamera(
  { boxes, alerted },
  ref,
) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>({ phase: 'starting' });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      // Sin HTTPS (por ejemplo, abriendo la IP del PC desde otro equipo) el navegador la bloquea.
      setState({
        phase: 'error',
        message: 'Este navegador no permite usar la cámara aquí. Ábrelo desde localhost.',
      });
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((media) => {
        if (!alive) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        const element = video.current;
        if (!element) return;
        element.srcObject = media;
        element.onloadedmetadata = () => {
          void element.play();
          setState({ phase: 'ready', ratio: element.videoWidth / element.videoHeight || 16 / 9 });
        };
      })
      .catch(
        (error: unknown) => alive && setState({ phase: 'error', message: cameraError(error) }),
      );

    return () => {
      alive = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async capture() {
      const element = video.current;
      if (!element || !element.videoWidth) return null;

      const scale = Math.min(1, CAPTURE_MAX_WIDTH / element.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(element.videoWidth * scale);
      canvas.height = Math.round(element.videoHeight * scale);
      canvas.getContext('2d')?.drawImage(element, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      if (!blob) return null;
      const file = new File([blob], 'cuadro.jpg', { type: 'image/jpeg' });
      return { uri: '', name: file.name, mimeType: file.type, size: file.size, file };
    },
  }));

  const ratio = state.phase === 'ready' ? state.ratio : 16 / 9;

  return (
    <View
      style={{
        aspectRatio: ratio,
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
      <video
        ref={video}
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: state.phase === 'ready' ? 1 : 0,
        }}
      />
      {state.phase === 'ready' ? <DetectionOverlay boxes={boxes} alerted={alerted} /> : null}
      {state.phase === 'starting' ? (
        <View style={{ alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color={palette.accent400} />
          <Text className="text-sm text-steel-400">Abriendo la cámara…</Text>
        </View>
      ) : null}
      {state.phase === 'error' ? (
        <View style={{ alignItems: 'center', gap: 10, padding: 24, maxWidth: 420 }}>
          <ScanIcon size={30} color={palette.steel500} />
          <Text className="text-center text-sm leading-5 text-steel-300">{state.message}</Text>
        </View>
      ) : null}
    </View>
  );
});
