import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { CarIcon, ChevronRightIcon } from '@/components/ui/icons';
import { AccessStatePill } from '@/components/ui/status-pills';
import { palette } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { routes } from '@/lib/routes';
import { accessService, type AccessLog } from '@/services/access.service';

function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function formatDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;

  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccessListScreen() {
  const insets = useSafeAreaInsets();
  const [accesses, setAccesses] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await accessService.mine();
      setAccesses(response.accesses);
    } catch (err) {
      setError(apiMessage(err, 'No pudimos cargar tus ingresos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-semibold text-white">Mis ingresos</Text>
        <Text className="text-sm leading-5 text-steel-400">
          Consulta el día, la hora de entrada y salida, y con qué vehículo o dispositivos entró y
          salió.
        </Text>
      </View>

      {error ? <Banner tone="error" message={error} /> : null}

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={palette.accent400} />
        </View>
      ) : null}

      {!loading && accesses.length === 0 ? (
        <View className="rounded-card border border-ink-600 bg-ink-900 p-5">
          <Text className="text-sm text-steel-400">
            Todavía no tienes ingresos registrados. Cuando portería te registre, aparecerán aquí.
          </Text>
        </View>
      ) : null}

      {accesses.map((access) => {
        const entryDevices =
          access.accessAssets?.filter((row) => row.moment === 'CHECK_IN').length ?? 0;
        const exitDevices =
          access.accessAssets?.filter((row) => row.moment === 'CHECK_OUT').length ?? 0;
        const hasExit = Boolean(access.checkOutTime);

        return (
          <Pressable
            key={access.id}
            accessibilityRole="button"
            onPress={() => router.push(routes.adminAccessDetail(access.id))}
            className="rounded-card border border-ink-600 bg-ink-900 px-4 py-4 active:bg-ink-800"
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1.5">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="text-base font-medium text-steel-100">
                    {formatDate(access.date)}
                  </Text>
                  <AccessStatePill state={access.state} />
                </View>
                <Text className="text-sm text-steel-400">
                  Entrada {formatTime(access.checkInTime)}
                  {' · '}
                  Salida {formatTime(access.checkOutTime)}
                </Text>
                <Text className="text-xs text-steel-500">
                  Entrada:{' '}
                  {access.vehicle
                    ? `vehículo ${access.vehicle.licensePlateNumber}`
                    : 'sin vehículo'}
                  {entryDevices > 0
                    ? ` · ${entryDevices} dispositivo${entryDevices === 1 ? '' : 's'}`
                    : ''}
                </Text>
                {hasExit ? (
                  <Text className="text-xs text-steel-500">
                    Salida:{' '}
                    {access.checkOutVehicle
                      ? `vehículo ${access.checkOutVehicle.licensePlateNumber}`
                      : 'sin vehículo'}
                    {exitDevices > 0
                      ? ` · ${exitDevices} dispositivo${exitDevices === 1 ? '' : 's'}`
                      : ''}
                  </Text>
                ) : null}
              </View>

              <View className="items-end gap-2">
                {access.vehicle || access.checkOutVehicle ? (
                  <CarIcon size={18} color={palette.accent300} />
                ) : null}
                <ChevronRightIcon size={18} color={palette.steel500} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
