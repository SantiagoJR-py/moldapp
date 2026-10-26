import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { initials, resolveImageUrl } from '@/lib/images';

type AvatarProps = {
  fullName: string;
  urlImage?: string | null;
  size?: number;
};

export function Avatar({ fullName, urlImage, size = 40 }: AvatarProps) {
  const source = resolveImageUrl(urlImage);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(77, 163, 255, 0.35)',
        backgroundColor: palette.ink700,
        // La sombra despega la foto del fondo; sin ella se ve pegada y plana.
        boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.40)',
      }}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          className="font-semibold text-accent-300"
          style={{ fontSize: Math.max(11, size * 0.36) }}
        >
          {initials(fullName)}
        </Text>
      )}
    </View>
  );
}
