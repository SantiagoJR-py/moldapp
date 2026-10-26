import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { motion, palette, radius } from '@/constants/theme';
import { AlertIcon, CheckIcon, InfoIcon } from './icons';

type Tone = 'error' | 'success' | 'info';

type BannerProps = {
  tone: Tone;
  message: string;
};

const box: Record<Tone, { border: string; background: string }> = {
  error: { border: 'rgba(251, 113, 133, 0.38)', background: 'rgba(251, 113, 133, 0.10)' },
  success: { border: 'rgba(52, 211, 153, 0.38)', background: 'rgba(52, 211, 153, 0.10)' },
  info: { border: 'rgba(61, 143, 245, 0.38)', background: 'rgba(61, 143, 245, 0.10)' },
};

const textColor: Record<Tone, string> = {
  error: 'text-state-danger',
  success: 'text-state-success',
  info: 'text-accent-300',
};

const iconColor: Record<Tone, string> = {
  error: palette.danger,
  success: palette.success,
  info: palette.accent300,
};

/** Aviso de resultado. Entra deslizando para que el cambio se note sin gritar. */
export function Banner({ tone, message }: BannerProps) {
  const Icon = tone === 'error' ? AlertIcon : tone === 'success' ? CheckIcon : InfoIcon;

  return (
    <Animated.View
      // La clave hace que cambiar de tono o de texto reinicie la entrada, en vez
      // de mutar el aviso en silencio y pasar desapercibido.
      key={`${tone}-${message}`}
      entering={FadeInDown.duration(motion.base).springify().damping(20)}
      exiting={FadeOut.duration(motion.fast)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        borderRadius: radius.field,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: box[tone].border,
        backgroundColor: box[tone].background,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View className="mt-0.5">
        <Icon size={18} color={iconColor[tone]} />
      </View>
      <Text className={`flex-1 text-sm leading-5 ${textColor[tone]}`}>{message}</Text>
    </Animated.View>
  );
}
