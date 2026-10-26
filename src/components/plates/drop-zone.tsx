import * as ImagePicker from 'expo-image-picker';
import { Text, View } from 'react-native';

import { UploadIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { palette, radius } from '@/constants/theme';
import type { DropZoneProps } from './drop-zone.types';

/** En el celular no hay arrastrar y soltar: se elige el archivo de la galería. */
export function DropZone({ onFile, disabled = false, title, hint }: DropZoneProps) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'] });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    onFile({
      uri: asset.uri,
      name: asset.fileName ?? 'archivo',
      mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      size: asset.fileSize ?? 0,
    });
  }

  return (
    <PressableScale
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => void pick()}
      style={{
        alignItems: 'center',
        gap: 12,
        borderRadius: radius.card,
        borderCurve: 'continuous',
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: palette.ink600,
        backgroundColor: palette.ink800,
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
    >
      <UploadIcon size={24} color={palette.accent400} />
      <View className="items-center gap-1">
        <Text className="text-center text-base font-semibold text-steel-100">{title}</Text>
        <Text className="text-center text-xs leading-5 text-steel-400">{hint}</Text>
      </View>
    </PressableScale>
  );
}
