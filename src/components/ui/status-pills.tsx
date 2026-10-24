import { Text, View } from 'react-native';

import { roleLabel } from '@/constants/roles';

type Tone = 'accent' | 'neutral' | 'success' | 'warn' | 'danger';

const TONE_CLASS: Record<Tone, string> = {
  accent: 'border-accent-400/40 bg-accent-400/15',
  neutral: 'border-ink-500 bg-ink-800',
  success: 'border-state-success/40 bg-state-success/15',
  warn: 'border-state-warning/40 bg-state-warning/15',
  danger: 'border-state-danger/40 bg-state-danger/15',
};

const TONE_TEXT: Record<Tone, string> = {
  accent: 'text-accent-300',
  neutral: 'text-steel-300',
  success: 'text-state-success',
  warn: 'text-state-warning',
  danger: 'text-state-danger',
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <View className={`rounded-full border px-2.5 py-1 ${TONE_CLASS[tone]}`}>
      <Text className={`text-[11px] font-semibold ${TONE_TEXT[tone]}`}>{label}</Text>
    </View>
  );
}

/** Chip visual para el nombre de rol (STUDENT, WARDEN, …). */
export const RolePill = ({ roleName }: { roleName: string | undefined }) => {
  const tone: Tone =
    roleName === 'ADMINISTRATIVE_STAFF' || roleName === 'WARDEN'
      ? 'accent'
      : roleName === 'TEACHER' || roleName === 'STAFF'
        ? 'warn'
        : 'neutral';

  return <Pill label={roleLabel(roleName)} tone={tone} />;
};

/** Activo / Inactivo (usuarios). */
export const UserStatePill = ({ state }: { state: string | undefined }) => {
  const active = state === 'ENABLED';
  return <Pill label={active ? 'Activo' : 'Inactivo'} tone={active ? 'success' : 'danger'} />;
};

/** Dentro / Fuera (ingresos). */
export const AccessStatePill = ({ state }: { state: string | undefined }) => {
  const inside = state === 'INSIDE';
  return <Pill label={inside ? 'Dentro' : 'Fuera'} tone={inside ? 'success' : 'neutral'} />;
};
