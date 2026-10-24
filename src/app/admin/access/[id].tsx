import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { AccessStatePill } from '@/components/ui/status-pills';
import { palette } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { accessService, type AccessLog } from '@/services/access.service';
import type { Vehicle } from '@/services/vehicle.service';

function formatTime(value: string | null | undefined): string {
  if (!value) return 'Pendiente';
  return String(value).slice(0, 5);
}

function vehicleLabel(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Sin vehículo / a pie';
  return [
    vehicle.brand?.name,
    vehicle.version?.name,
    vehicle.licensePlateNumber ? `(${vehicle.licensePlateNumber})` : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function AccessDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [access, setAccess] = useState<AccessLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await accessService.mineOne(Number(id));
      setAccess(response.access);
    } catch (err) {
      setError(apiMessage(err, 'No pudimos cargar el detalle del ingreso.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const entryAssets = useMemo(
    () => (access?.accessAssets ?? []).filter((row) => row.moment === 'CHECK_IN'),
    [access],
  );
  const exitAssets = useMemo(
    () => (access?.accessAssets ?? []).filter((row) => row.moment === 'CHECK_OUT'),
    [access],
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-950">
        <ActivityIndicator color={palette.accent400} />
      </View>
    );
  }

  if (error || !access) {
    return (
      <View className="flex-1 bg-ink-950 p-5">
        <Banner tone="error" message={error ?? 'Ingreso no encontrado.'} />
      </View>
    );
  }

  const hasExit = Boolean(access.checkOutTime);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-semibold text-white">Detalle del ingreso</Text>
        <Text className="text-sm text-steel-400">{access.date}</Text>
      </View>

      <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-3">
        <Row label="Entrada" value={formatTime(access.checkInTime)} />
        <Row label="Salida" value={formatTime(access.checkOutTime)} />
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-sm text-steel-500">Estado</Text>
          <AccessStatePill state={access.state} />
        </View>
      </View>

      <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-3">
        <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
          Vehículo
        </Text>
        <Row label="Entrada" value={vehicleLabel(access.vehicle)} />
        <Row
          label="Salida"
          value={hasExit ? vehicleLabel(access.checkOutVehicle) : 'Pendiente'}
        />
      </View>

      <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-3">
        <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
          Dispositivos
        </Text>

        <Text className="text-xs font-medium text-steel-500">Entrada</Text>
        {entryAssets.length === 0 ? (
          <Text className="text-sm text-steel-400">Ninguno declarado.</Text>
        ) : (
          entryAssets.map((row) => (
            <Text key={`in-${row.id}`} className="text-sm text-steel-100">
              • {row.asset?.description ?? `Dispositivo #${row.assetId ?? row.id}`}
            </Text>
          ))
        )}

        <Text className="mt-2 text-xs font-medium text-steel-500">Salida</Text>
        {!hasExit ? (
          <Text className="text-sm text-steel-400">Pendiente.</Text>
        ) : exitAssets.length === 0 ? (
          <Text className="text-sm text-steel-400">Ninguno declarado.</Text>
        ) : (
          exitAssets.map((row) => (
            <Text key={`out-${row.id}`} className="text-sm text-steel-100">
              • {row.asset?.description ?? `Dispositivo #${row.assetId ?? row.id}`}
            </Text>
          ))
        )}
      </View>

      {access.notes ? (
        <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-2">
          <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">Notas</Text>
          <Text className="text-sm text-steel-200">{access.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-sm text-steel-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-steel-100">{value}</Text>
    </View>
  );
}
