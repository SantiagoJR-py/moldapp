import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons';
import { normalizeScannedDocument } from '@/lib/barcode-id';

/** Formatos habituales en carnets universitarios / cédulas. */
const BARCODE_TYPES = [
  'code128',
  'code39',
  'code93',
  'codabar',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'itf14',
  'pdf417',
  'qr',
] as const;

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Se llama una vez con el documento limpio. */
  onScan: (document: string) => void;
};

/**
 * Escáner a pantalla completa para portería.
 * Solo tiene sentido en dispositivo nativo (Expo Go / build).
 */
export function BarcodeScannerModal({ visible, onClose, onScan }: BarcodeScannerModalProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) {
      handled.current = false;
      setLocked(false);
      return;
    }

    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  function handleBarcode(result: BarcodeScanningResult) {
    if (handled.current || locked) return;

    const document = normalizeScannedDocument(result.data);
    if (!document) return;

    handled.current = true;
    setLocked(true);
    onScan(document);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-ink-950">
        {Platform.OS === 'web' ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Text className="text-center text-base text-steel-200">
              El escaneo del carnet funciona en el celular (Expo Go o la app instalada).
            </Text>
            <Button label="Cerrar" onPress={onClose} />
          </View>
        ) : !permission ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-steel-400">Preparando la cámara…</Text>
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Text className="text-center text-base text-steel-200">
              Necesitamos permiso de cámara para leer el código de barras del carnet.
            </Text>
            <Button label="Permitir cámara" onPress={() => void requestPermission()} />
            <Button label="Cancelar" variant="ghost" onPress={onClose} />
          </View>
        ) : (
          <View className="flex-1">
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
              onBarcodeScanned={locked ? undefined : handleBarcode}
            />

            <View
              pointerEvents="box-none"
              className="absolute left-0 right-0 top-0 px-4"
              style={{ paddingTop: insets.top + 8 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-medium text-white">Escanear carnet</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar escáner"
                  onPress={onClose}
                  className="h-10 w-10 items-center justify-center rounded-full bg-ink-900/80"
                >
                  <CloseIcon size={20} />
                </Pressable>
              </View>
            </View>

            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <View className="h-36 w-64 rounded-field border-2 border-accent-400/80" />
              <Text className="mt-4 px-8 text-center text-sm text-white/90">
                Centra el código de barras del carnet dentro del recuadro
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
