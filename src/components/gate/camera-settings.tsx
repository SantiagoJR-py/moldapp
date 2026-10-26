import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CloseIcon, TrashIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Segmented } from '@/components/ui/segmented';
import { motion, palette, radius } from '@/constants/theme';
import type { CameraDirection, GateCamera } from '@/services/gate.service';

type DirectionChoice = 'ENTRY' | 'EXIT' | 'AUTO';

type CameraSettingsProps = {
  camera: GateCamera;
  onDirection: (direction: CameraDirection) => Promise<void>;
  onRemove: () => Promise<void>;
  onClose: () => void;
};

/**
 * Ajustes de una cámara, encima de su propio video: el sentido (solo las entradas alertan) y
 * quitarla. Quitar es un soft delete: la cámara se detiene, pero se puede restaurar.
 */
export function CameraSettings({ camera, onDirection, onRemove, onClose }: CameraSettingsProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<'direction' | 'remove' | null>(null);
  const current: DirectionChoice = camera.direction ?? 'AUTO';

  async function changeDirection(choice: DirectionChoice) {
    if (choice === current || busy) return;
    setBusy('direction');
    try {
      await onDirection(choice === 'AUTO' ? null : choice);
      onClose();
    } catch {
      // El monitor explica el error; los ajustes siguen abiertos para intentar de nuevo.
      setBusy(null);
    }
  }

  async function remove() {
    setBusy('remove');
    try {
      await onRemove();
    } catch {
      setBusy(null);
      setConfirming(false);
    }
  }

  return (
    <Animated.View
      entering={FadeIn.duration(motion.fast)}
      exiting={FadeOut.duration(motion.fast)}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: radius.card,
        borderCurve: 'continuous',
        backgroundColor: 'rgba(8, 12, 18, 0.93)',
      }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 12, padding: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-base font-semibold text-steel-100" numberOfLines={1}>
            {confirming ? `¿Quitar ${camera.name}?` : camera.name}
          </Text>
          {busy ? <ActivityIndicator size="small" color={palette.accent400} /> : null}
          <PressableScale
            accessibilityLabel="Cerrar ajustes"
            depth={0.88}
            disabled={busy !== null}
            onPress={onClose}
            style={{
              height: 32,
              width: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              backgroundColor: palette.ink700,
            }}
          >
            <CloseIcon size={15} color={palette.steel300} />
          </PressableScale>
        </View>

        {confirming ? (
          <>
            <Text className="text-xs leading-4 text-steel-300">
              Deja de leer placas y de alertar. No se borra: queda en Cámaras quitadas y se puede
              restaurar.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <PressableScale
                  accessibilityLabel={`Confirmar: quitar la cámara ${camera.name}`}
                  disabled={busy !== null}
                  onPress={() => void remove()}
                  style={{
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.field,
                    borderCurve: 'continuous',
                    backgroundColor: palette.danger,
                  }}
                >
                  <Text className="text-sm font-semibold text-ink-950">Quitar cámara</Text>
                </PressableScale>
              </View>
              <View style={{ flex: 1 }}>
                <PressableScale
                  accessibilityLabel="No quitar"
                  disabled={busy !== null}
                  onPress={() => setConfirming(false)}
                  style={{
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.field,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: palette.ink600,
                    backgroundColor: palette.ink700,
                  }}
                >
                  <Text className="text-sm font-medium text-steel-200">No quitar</Text>
                </PressableScale>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-medium text-steel-300">
                Sentido · solo las entradas alertan
              </Text>
              <Segmented
                accessibilityLabel={`Sentido de ${camera.name}`}
                value={current}
                onChange={(choice) => void changeDirection(choice)}
                segments={[
                  { value: 'ENTRY', label: 'Entrada' },
                  { value: 'EXIT', label: 'Salida' },
                  { value: 'AUTO', label: 'Automático' },
                ]}
              />
            </View>
            <PressableScale
              accessibilityLabel={`Quitar la cámara ${camera.name}`}
              disabled={busy !== null}
              onPress={() => setConfirming(true)}
              style={{
                height: 40,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: radius.field,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: 'rgba(251, 113, 133, 0.4)',
                backgroundColor: 'rgba(251, 113, 133, 0.08)',
              }}
            >
              <TrashIcon size={16} color={palette.danger} />
              <Text className="text-sm font-semibold text-state-danger">Quitar cámara</Text>
            </PressableScale>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}
