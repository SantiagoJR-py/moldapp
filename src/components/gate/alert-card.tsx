import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PlateChip } from '@/components/plates/plate-chip';
import { plateCard, tabular } from '@/components/plates/styles';
import { CameraIcon, CardIcon, CheckIcon, UsersIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { palette, radius } from '@/constants/theme';
import { isColombianPlate } from '@/constants/vehicle';
import { useGateAlerts } from '@/context/gate-alerts';
import { apiMessage } from '@/lib/api-messages';
import { resolveImageUrl } from '@/lib/images';
import { clockTime, relativeTime } from '@/lib/time';
import { gateService, type GateAlert } from '@/services/gate.service';
import { appear, vanish } from '@/lib/motion';

/** Los motivos que más se repiten en una portería: un toque en vez de escribir. */
const QUICK_REASONS = [
  'Domicilio',
  'Proveedor',
  'Visita a un funcionario',
  'Taxi o plataforma',
  'Evento',
];

type AlertCardProps = {
  alert: GateAlert;
  now: number;
  /** Abre directo el formulario de visita (cuando se llega desde la alerta en pantalla). */
  startWithVisit?: boolean;
};

/** Un vehículo sin registrar por resolver: inscribirlo con la tarjeta o dejarlo pasar como visita. */
export function AlertCard({ alert, now, startWithVisit = false }: AlertCardProps) {
  const { refresh } = useGateAlerts();
  const [visitOpen, setVisitOpen] = useState(startWithVisit);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = resolveImageUrl(alert.imagePath);
  const seenAt = new Date(alert.lastSeenAt).getTime();

  function register() {
    router.push({
      pathname: '/gate-register',
      params: { alertId: String(alert.id), plate: alert.licensePlateNumber },
    });
  }

  async function allowVisit() {
    if (note.trim().length < 3) {
      setError('Escribe el motivo de la visita.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await gateService.allowVisit(alert.id, note.trim());
      await refresh();
    } catch (caught) {
      setError(apiMessage(caught, 'No pudimos registrar la visita.'));
      setSaving(false);
    }
  }

  return (
    <View style={[plateCard, { gap: 14, padding: 16, borderColor: 'rgba(251, 113, 133, 0.45)' }]}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 flex-row flex-wrap items-center gap-2.5">
          <PlateChip
            plate={alert.licensePlateNumber}
            colombian={isColombianPlate(alert.licensePlateNumber)}
          />
          {alert.readsCount > 1 ? (
            <View
              className="rounded-pill px-2 py-0.5"
              style={{ backgroundColor: 'rgba(251, 113, 133, 0.14)' }}
            >
              <Text className="text-xs font-semibold text-state-danger">
                Entró {alert.readsCount} veces
              </Text>
            </View>
          ) : null}
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
            accessibilityLabel={`Foto de la placa ${alert.licensePlateNumber}`}
            style={{ height: 44, width: 88, borderRadius: 8, backgroundColor: palette.ink950 }}
          />
        ) : null}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <CameraIcon size={14} color={palette.steel400} />
            <Text className="flex-1 text-sm text-steel-200" numberOfLines={1}>
              {alert.cameraName}
            </Text>
          </View>
          {alert.source === 'UPLOAD' ? (
            <Text className="text-xs text-accent-300">Lectura de prueba</Text>
          ) : null}
        </View>
      </View>

      {visitOpen ? (
        <Animated.View
          entering={appear}
          exiting={vanish}
          style={{
            gap: 12,
            borderRadius: radius.field,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: palette.ink600,
            backgroundColor: palette.ink700,
            padding: 14,
          }}
        >
          <TextField
            label="Motivo de la visita"
            value={note}
            onChangeText={(value) => {
              setNote(value);
              setError(null);
            }}
            error={error}
            placeholder="Ej.: entrega de un domicilio"
            maxLength={200}
            autoFocus={!startWithVisit}
          />
          <View className="flex-row flex-wrap gap-2">
            {QUICK_REASONS.map((reason) => {
              const selected = note === reason;
              return (
                <PressableScale
                  key={reason}
                  accessibilityLabel={`Motivo: ${reason}`}
                  depth={0.94}
                  onPress={() => {
                    setNote(reason);
                    setError(null);
                  }}
                  style={{
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: selected ? palette.accent400 : palette.ink600,
                    backgroundColor: selected ? 'rgba(47, 128, 237, 0.18)' : palette.ink900,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    className={`text-sm ${selected ? 'font-medium text-accent-200' : 'text-steel-200'}`}
                  >
                    {reason}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <Text className="text-xs leading-4 text-steel-300">
            Puede entrar hoy sin volver a alertar. Si regresa otro día, se alerta de nuevo.
          </Text>
          <View className="flex-row gap-2">
            <Action
              label="Autorizar visita"
              icon="check"
              tone="primary"
              loading={saving}
              onPress={() => void allowVisit()}
            />
            <Action
              label="Cancelar"
              tone="quiet"
              disabled={saving}
              onPress={() => setVisitOpen(false)}
            />
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={appear} style={{ flexDirection: 'row', gap: 8 }}>
          <Action label="Inscribir con TP" icon="card" tone="primary" onPress={register} />
          <Action label="Visita" icon="visit" tone="quiet" onPress={() => setVisitOpen(true)} />
        </Animated.View>
      )}
    </View>
  );
}

type ActionProps = {
  label: string;
  tone: 'primary' | 'quiet';
  icon?: 'card' | 'visit' | 'check';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function Action({ label, tone, icon, loading = false, disabled = false, onPress }: ActionProps) {
  const primary = tone === 'primary';
  const color = primary ? palette.white : palette.steel100;
  const Icon =
    icon === 'card' ? CardIcon : icon === 'visit' ? UsersIcon : icon === 'check' ? CheckIcon : null;

  return (
    <View style={{ flex: primary ? 1.4 : 1 }}>
      <PressableScale
        accessibilityLabel={label}
        disabled={disabled || loading}
        onPress={onPress}
        style={{
          height: 46,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: radius.field,
          borderCurve: 'continuous',
          borderWidth: primary ? 0 : 1,
          borderColor: palette.ink600,
          backgroundColor: primary ? palette.accent600 : palette.ink700,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <>
            {Icon ? <Icon size={18} color={color} /> : null}
            <Text style={{ color, fontSize: 15, fontWeight: '600' }}>{label}</Text>
          </>
        )}
      </PressableScale>
    </View>
  );
}

/** Lo que ya se resolvió hoy: cómo y quién. */
export function ResolvedRow({ alert }: { alert: GateAlert }) {
  const registered = alert.status === 'REGISTERED';
  const who = alert.resolvedBy?.fullName.split(' ')[0];
  const owner = alert.vehicle?.owner?.fullName ?? alert.vehicle?.holderName;
  const detail = registered
    ? `Inscrito${owner ? ` a nombre de ${owner}` : ''}`
    : `Visita: ${alert.resolutionNote ?? 'sin motivo'}`;

  return (
    <View className="flex-row items-center gap-3" style={{ paddingVertical: 10 }}>
      <PlateChip
        plate={alert.licensePlateNumber}
        colombian={isColombianPlate(alert.licensePlateNumber)}
        size="sm"
      />
      <View className="flex-1">
        <Text className="text-sm text-steel-100" numberOfLines={1}>
          {detail}
        </Text>
        <Text className="text-xs text-steel-400" numberOfLines={1}>
          {who ? `Por ${who}` : 'Resuelta'}
          {alert.resolvedAt ? ` · ${clockTime(new Date(alert.resolvedAt).getTime())}` : ''}
        </Text>
      </View>
      <View
        className="rounded-pill px-2 py-0.5"
        style={{
          backgroundColor: registered ? 'rgba(52, 211, 153, 0.14)' : 'rgba(251, 191, 36, 0.14)',
        }}
      >
        <Text
          className="text-xs font-semibold"
          style={{ color: registered ? palette.success : palette.warning }}
        >
          {registered ? 'Inscrito' : 'Visita'}
        </Text>
      </View>
    </View>
  );
}
