import { Image } from 'expo-image';
import { Text, View } from 'react-native';

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
      className="items-center justify-center overflow-hidden rounded-full border border-accent-500/30 bg-ink-700"
      style={{ width: size, height: size }}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
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
