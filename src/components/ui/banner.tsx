import { Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { AlertIcon, CheckIcon, InfoIcon } from './icons';

type Tone = 'error' | 'success' | 'info';

type BannerProps = {
  tone: Tone;
  message: string;
};

const box: Record<Tone, string> = {
  error: 'border-state-danger/40 bg-state-danger/10',
  success: 'border-state-success/40 bg-state-success/10',
  info: 'border-accent-500/40 bg-accent-500/10',
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

export function Banner({ tone, message }: BannerProps) {
  const Icon = tone === 'error' ? AlertIcon : tone === 'success' ? CheckIcon : InfoIcon;

  return (
    <View className={`flex-row items-start gap-3 rounded-field border px-4 py-3 ${box[tone]}`}>
      <View className="mt-0.5">
        <Icon size={18} color={iconColor[tone]} />
      </View>
      <Text className={`flex-1 text-sm ${textColor[tone]}`}>{message}</Text>
    </View>
  );
}
