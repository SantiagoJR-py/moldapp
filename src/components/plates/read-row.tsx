import { Text, View } from 'react-native';

import { EntryIcon, ExitIcon } from '@/components/ui/icons';
import { palette } from '@/constants/theme';
import { clockTime } from '@/lib/time';
import type { PlateRead } from '@/services/plate-read.service';
import { PlateChip } from './plate-chip';
import { tabular } from './styles';

/** Una lectura en una línea, para las columnas en vivo. */
export function ReadRow({ read }: { read: PlateRead }) {
  const entry = read.direction === 'ENTRY';
  const Icon = entry ? EntryIcon : ExitIcon;
  const who =
    read.vehicle?.owner?.fullName ??
    (read.vehicle
      ? 'Vehículo registrado'
      : read.alert?.status === 'ALLOWED_VISIT'
        ? 'Visita autorizada'
        : 'No registrado');
  const flagged =
    !read.vehicle && read.alert?.status !== 'ALLOWED_VISIT' && read.alert?.status !== 'REGISTERED';

  return (
    <View className="flex-row items-center gap-2.5" style={{ paddingVertical: 7 }}>
      <PlateChip plate={read.licensePlateNumber} colombian={Boolean(read.vehicleType)} size="sm" />
      <Icon size={15} color={entry ? palette.success : palette.steel400} />
      <Text
        className="flex-1 text-xs"
        numberOfLines={1}
        style={{ color: flagged ? palette.danger : palette.steel300 }}
      >
        {read.alert?.status === 'REGISTERED' && !read.vehicle ? 'Inscrito en portería' : who}
      </Text>
      <Text className="text-xs text-steel-400" style={tabular}>
        {clockTime(new Date(read.seenAt).getTime())}
      </Text>
    </View>
  );
}
