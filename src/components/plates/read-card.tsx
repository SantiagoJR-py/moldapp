import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  AlertIcon,
  CameraIcon,
  CardIcon,
  CheckIcon,
  EntryIcon,
  ExitIcon,
  PencilIcon,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { roleLabel } from '@/constants/roles';
import { palette, radius } from '@/constants/theme';
import { resolveImageUrl } from '@/lib/images';
import { clockTime, relativeTime } from '@/lib/time';
import type { PlateRead } from '@/services/plate-read.service';
import { PlateChip } from './plate-chip';
import { CorrectionEditor, CorrectionNote } from './read-correction';
import { plateCard, tabular } from './styles';

/** Por debajo de esto, o con varias correcciones de formato, la lectura merece una mirada. */
const REVIEW_CONFIDENCE = 0.8;

type ReadCardProps = {
  read: PlateRead;
  now: number;
  /** Portería: abre la inscripción con la tarjeta de propiedad de este vehículo. */
  onRegister?: () => void;
  /** Portería: corrigió la lectura; la original quedó con soft delete y esta la reemplaza. */
  onCorrected?: (replacedId: number, read: PlateRead) => void;
};

export function ReadCard({ read, now, onRegister, onCorrected }: ReadCardProps) {
  const [editing, setEditing] = useState(false);
  const registered = Boolean(read.vehicle);
  const resolution = registered ? null : read.alert?.status;
  const owner = read.vehicle?.owner;
  const entry = read.direction === 'ENTRY';
  const needsReview = read.confidence < REVIEW_CONFIDENCE || read.corrections >= 2;
  const seenAt = new Date(read.seenAt).getTime();
  const image = resolveImageUrl(read.imagePath);

  const vehicleLine = read.vehicle
    ? [read.vehicle.brand?.name, read.vehicle.version?.name, read.vehicle.model]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <View
      style={[
        plateCard,
        { gap: 14, padding: 16 },
        registered || resolution === 'REGISTERED' || resolution === 'ALLOWED_VISIT'
          ? null
          : { borderColor: 'rgba(251, 113, 133, 0.45)' },
      ]}
    >
      <View className="flex-row items-start gap-3">
        <View className="flex-1 flex-row flex-wrap items-center gap-2.5">
          <PlateChip plate={read.licensePlateNumber} colombian={Boolean(read.vehicleType)} />
          <DirectionTag entry={entry} />
        </View>
        <View className="items-end">
          <Text className="text-base font-semibold text-steel-100" style={tabular}>
            {clockTime(seenAt)}
          </Text>
          <Text className="text-xs text-steel-400">{relativeTime(seenAt, now)}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        {image ? (
          <Image
            source={{ uri: image }}
            contentFit="contain"
            accessibilityLabel={`Foto de la placa ${read.licensePlateNumber}`}
            style={{
              height: 44,
              width: 88,
              borderRadius: 8,
              backgroundColor: palette.ink950,
            }}
          />
        ) : null}

        <View className="flex-1 gap-0.5">
          {registered ? (
            <>
              <Text className="text-base font-semibold text-steel-100" numberOfLines={1}>
                {owner?.fullName ?? 'Vehículo registrado'}
              </Text>
              <Text className="text-sm text-steel-300" numberOfLines={1}>
                {[owner ? roleLabel(owner.role?.name) : null, vehicleLine]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </>
          ) : resolution === 'REGISTERED' ? (
            <>
              <View className="flex-row items-center gap-1.5">
                <CheckIcon size={16} color={palette.success} />
                <Text className="text-base font-semibold text-state-success">
                  Inscrito en portería
                </Text>
              </View>
              <Text className="text-sm text-steel-300">
                Entró sin registrar y ya quedó inscrito.
              </Text>
            </>
          ) : resolution === 'ALLOWED_VISIT' ? (
            <>
              <Text className="text-base font-semibold text-state-warning">Visita autorizada</Text>
              <Text className="text-sm text-steel-300" numberOfLines={2}>
                {read.alert?.resolutionNote ?? 'Sin motivo'}
              </Text>
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-1.5">
                <AlertIcon size={16} color={palette.danger} />
                <Text className="text-base font-semibold text-state-danger">No registrado</Text>
              </View>
              <Text className="text-sm text-steel-300">Esta placa no está inscrita en ENTRYX.</Text>
            </>
          )}
        </View>
      </View>

      <View className="flex-row flex-wrap items-center" style={{ columnGap: 12, rowGap: 8 }}>
        <View className="flex-row items-center gap-1.5">
          <CameraIcon size={14} color={palette.steel500} />
          <Text className="text-xs text-steel-300">{read.cameraName}</Text>
        </View>
        <Text className="text-xs text-steel-400" style={tabular}>
          Lectura {Math.round(read.confidence * 100)} %
        </Text>
        {read.source === 'UPLOAD' ? (
          <View
            style={{
              borderRadius: radius.pill,
              backgroundColor: 'rgba(61, 143, 245, 0.14)',
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text className="text-xs font-medium text-accent-300">Prueba</Text>
          </View>
        ) : null}
        {needsReview ? (
          <View
            style={{
              borderRadius: radius.pill,
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text className="text-xs font-medium text-state-warning">Revisar lectura</Text>
          </View>
        ) : null}
        {onCorrected && !editing ? (
          <PressableScale
            accessibilityLabel={`Corregir la lectura de ${read.licensePlateNumber}`}
            depth={0.94}
            onPress={() => setEditing(true)}
            style={{
              marginLeft: 'auto',
              minHeight: 32,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: palette.ink600,
              paddingHorizontal: 10,
            }}
          >
            <PencilIcon size={13} color={palette.steel300} />
            <Text className="text-xs font-medium text-steel-200">Corregir</Text>
          </PressableScale>
        ) : null}
      </View>

      <CorrectionNote read={read} />

      {editing && onCorrected ? (
        <CorrectionEditor read={read} onCancel={() => setEditing(false)} onSaved={onCorrected} />
      ) : null}

      {onRegister && !editing && !registered && resolution !== 'REGISTERED' ? (
        <PressableScale
          accessibilityLabel={`Inscribir ${read.licensePlateNumber} con la tarjeta de propiedad`}
          onPress={onRegister}
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: radius.field,
            borderCurve: 'continuous',
            backgroundColor: resolution === 'ALLOWED_VISIT' ? palette.ink700 : palette.accent600,
            borderWidth: resolution === 'ALLOWED_VISIT' ? 1 : 0,
            borderColor: palette.ink600,
          }}
        >
          <CardIcon
            size={18}
            color={resolution === 'ALLOWED_VISIT' ? palette.steel100 : palette.white}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: resolution === 'ALLOWED_VISIT' ? palette.steel100 : palette.white,
            }}
          >
            Inscribir con tarjeta de propiedad
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function DirectionTag({ entry }: { entry: boolean }) {
  const Icon = entry ? EntryIcon : ExitIcon;
  return (
    <View
      className="flex-row items-center gap-1.5"
      style={{
        borderRadius: radius.pill,
        backgroundColor: entry ? 'rgba(52, 211, 153, 0.12)' : palette.ink700,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Icon size={15} color={entry ? palette.success : palette.steel300} />
      <Text
        className="text-xs font-semibold"
        style={{ color: entry ? palette.success : palette.steel300 }}
      >
        {entry ? 'Entrada' : 'Salida'}
      </Text>
    </View>
  );
}
