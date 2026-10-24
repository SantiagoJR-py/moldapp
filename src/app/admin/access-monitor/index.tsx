import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Socket } from 'socket.io-client';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CarIcon, CloseIcon, IdIcon, UserIcon } from '@/components/ui/icons';
import { AccessStatePill, RolePill } from '@/components/ui/status-pills';
import { TextField } from '@/components/ui/text-field';
import { RoleName } from '@/constants/roles';
import { palette } from '@/constants/theme';
import { connectAccessSocket, type AccessSocketPayload } from '@/lib/access-socket';
import { apiMessage } from '@/lib/api-messages';
import {
  accessService,
  type AccessLog,
  type AccessPagination,
} from '@/services/access.service';
import type { Vehicle } from '@/services/vehicle.service';

const PAGE_SIZE = 15;

type TriFilter = boolean | null;

type ChipOption<T extends string> = { value: T; label: string };

const STATE_CHIPS: ChipOption<'' | 'INSIDE' | 'OUTSIDE'>[] = [
  { value: '', label: 'Todos' },
  { value: 'INSIDE', label: 'Dentro' },
  { value: 'OUTSIDE', label: 'Fuera' },
];

const TRI_CHIPS: { value: TriFilter; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

const ROLE_CHIPS: ChipOption<string>[] = [
  { value: '', label: 'Todos' },
  { value: RoleName.STUDENT, label: 'Estudiante' },
  { value: RoleName.TEACHER, label: 'Docente' },
  { value: RoleName.STAFF, label: 'Personal' },
  { value: RoleName.ADMINISTRATIVE_STAFF, label: 'Admin' },
  { value: RoleName.WARDEN, label: 'Portería' },
  { value: RoleName.EXTERNAL_PERSONS, label: 'Externo' },
];

function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function vehicleShort(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Sin vehículo';
  return vehicle.licensePlateNumber || 'Con vehículo';
}

function vehicleFull(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Sin vehículo / a pie';
  return [vehicle.brand?.name, vehicle.version?.name, `(${vehicle.licensePlateNumber})`]
    .filter(Boolean)
    .join(' ');
}

function entryDeviceCount(access: AccessLog): number {
  return (access.accessAssets ?? []).filter((row) => row.moment === 'CHECK_IN').length;
}

function ChipRow<T extends string | boolean | null>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-2">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={String(option.value)}
                onPress={() => onChange(option.value)}
                className={`rounded-field border px-3 py-2 ${
                  active
                    ? 'border-accent-400 bg-accent-400/15'
                    : 'border-ink-600 bg-ink-950'
                }`}
              >
                <Text className={`text-xs ${active ? 'text-accent-300' : 'text-steel-300'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function AccessMonitorScreen() {
  const insets = useSafeAreaInsets();
  const socketRef = useRef<Socket | null>(null);

  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [state, setState] = useState<'' | 'INSIDE' | 'OUTSIDE'>('');
  const [withVehicle, setWithVehicle] = useState<TriFilter>(null);
  const [withDevice, setWithDevice] = useState<TriFilter>(null);
  const [role, setRole] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);
  const [accesses, setAccesses] = useState<AccessLog[]>([]);
  const [pagination, setPagination] = useState<AccessPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveHint, setLiveHint] = useState<string | null>(null);

  const [selected, setSelected] = useState<AccessLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        name,
        identification,
        state,
        withVehicle,
        withDevice,
        role,
        dateFrom,
        dateTo,
      }),
    [name, identification, state, withVehicle, withDevice, role, dateFrom, dateTo],
  );

  const load = useCallback(
    async (nextPage = page, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const response = await accessService.adminList({
          page: nextPage,
          pageSize: PAGE_SIZE,
          name: name.trim() || undefined,
          identification: identification.trim() || undefined,
          state: state || undefined,
          withVehicle,
          withDevice,
          role: role || undefined,
          dateFrom: dateFrom.trim() || undefined,
          dateTo: dateTo.trim() || undefined,
        });
        setAccesses(response.accesses);
        setPagination(response.pagination);
        setPage(response.pagination.page);
        setLiveHint(null);
      } catch (err) {
        setError(apiMessage(err, 'No pudimos cargar los ingresos.'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, name, identification, state, withVehicle, withDevice, role, dateFrom, dateTo],
  );

  useEffect(() => {
    setPage(1);
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga al cambiar filtros
  }, [filtersKey]);

  const pageRef = useRef(page);
  pageRef.current = page;
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const socket = connectAccessSocket((payload: AccessSocketPayload) => {
      setLiveHint(
        payload.event === 'check-in'
          ? 'Nuevo ingreso en vivo'
          : 'Salida registrada en vivo',
      );
      void loadRef.current(pageRef.current, true);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  async function openDetail(access: AccessLog) {
    setSelected(access);
    setDetailLoading(true);

    try {
      const response = await accessService.adminOne(access.id);
      setSelected(response.access);
    } catch {
      // Mantiene el resumen de la lista si falla el detalle.
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <View className="flex-1 bg-ink-950">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 14 }}
      >
        <View className="gap-1">
          <Text className="text-2xl font-semibold text-white">Ingresos campus</Text>
          <Text className="text-sm leading-5 text-steel-400">
            Todos los registros de entrada y salida. Se actualizan en vivo cuando portería
            registra un movimiento.
          </Text>
        </View>

        {liveHint ? <Banner tone="success" message={liveHint} /> : null}
        {error ? <Banner tone="error" message={error} /> : null}

        <View className="rounded-card border border-ink-600 bg-ink-900 p-4 gap-4">
          <TextField
            label="Buscar por nombre"
            placeholder="Ana, Carlos…"
            value={name}
            onChangeText={setName}
            icon={<UserIcon />}
          />
          <TextField
            label="Cédula / documento"
            placeholder="Número sin puntos"
            value={identification}
            onChangeText={setIdentification}
            icon={<IdIcon />}
            keyboardType="number-pad"
          />

          <ChipRow label="Estado en campus" options={STATE_CHIPS} value={state} onChange={setState} />
          <ChipRow
            label="Con vehículo (ingreso)"
            options={TRI_CHIPS}
            value={withVehicle}
            onChange={setWithVehicle}
          />
          <ChipRow
            label="Con dispositivo (ingreso)"
            options={TRI_CHIPS}
            value={withDevice}
            onChange={setWithDevice}
          />
          <ChipRow label="Rol" options={ROLE_CHIPS} value={role} onChange={setRole} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Desde (AAAA-MM-DD)"
                placeholder="2026-09-01"
                value={dateFrom}
                onChangeText={setDateFrom}
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Hasta"
                placeholder="2026-09-30"
                value={dateTo}
                onChangeText={setDateTo}
              />
            </View>
          </View>

          <Button label="Actualizar lista" variant="outline" onPress={() => void load(page)} />
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={palette.accent400} />
          </View>
        ) : null}

        {!loading && accesses.length === 0 ? (
          <View className="rounded-card border border-ink-600 bg-ink-900 p-5">
            <Text className="text-sm text-steel-400">
              No hay registros con esos filtros.
            </Text>
          </View>
        ) : null}

        {accesses.map((access) => {
          const devices = entryDeviceCount(access);

          return (
            <Pressable
              key={access.id}
              accessibilityRole="button"
              onPress={() => void openDetail(access)}
              className="rounded-card border border-ink-600 bg-ink-900 px-4 py-4 active:bg-ink-800"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1.5">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-xs text-steel-500">#{access.id}</Text>
                    <AccessStatePill state={access.state} />
                    <RolePill roleName={access.user?.role?.name} />
                  </View>
                  <Text className="text-base font-medium text-steel-100">
                    {access.user?.fullName ?? `Usuario #${access.userId}`}
                  </Text>
                  <Text className="text-sm text-steel-400">
                    {access.date} · In {formatTime(access.checkInTime)} · Out{' '}
                    {formatTime(access.checkOutTime)}
                  </Text>
                  <Text className="text-xs text-steel-500">
                    {access.vehicle
                      ? `Con vehículo (${vehicleShort(access.vehicle)})`
                      : 'Sin vehículo'}
                    {devices > 0 ? ` · ${devices} disp.` : ' · Sin dispositivo'}
                  </Text>
                </View>
                {access.vehicle ? <CarIcon size={18} color={palette.accent300} /> : null}
              </View>
            </Pressable>
          );
        })}

        {pagination && pagination.total > 0 ? (
          <View className="rounded-card border border-ink-600 bg-ink-900 p-4 gap-3">
            <Text className="text-center text-sm text-steel-400">
              Página {pagination.page} de {pagination.totalPages} · {pagination.total} registros
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Anterior"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onPress={() => void load(page - 1)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Siguiente"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onPress={() => void load(page + 1)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View className="flex-1 bg-ink-950" style={{ paddingTop: insets.top + 8 }}>
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-semibold text-white">
              Registro #{selected?.id ?? ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={() => setSelected(null)}
              className="h-10 w-10 items-center justify-center rounded-full bg-ink-800"
            >
              <CloseIcon size={20} />
            </Pressable>
          </View>

          {detailLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={palette.accent400} />
            </View>
          ) : selected ? (
            <ScrollView
              contentContainerStyle={{
                padding: 20,
                paddingBottom: insets.bottom + 32,
                gap: 14,
              }}
            >
              <DetailCard title="Persona">
                <DetailRow label="Nombre" value={selected.user?.fullName ?? '—'} />
                <View className="flex-row items-center justify-between gap-3 py-0.5">
                  <Text className="text-sm text-steel-500">Rol</Text>
                  <RolePill roleName={selected.user?.role?.name} />
                </View>
                <DetailRow
                  label="Documento"
                  value={selected.user?.identification ?? '—'}
                />
                <DetailRow label="Correo" value={selected.user?.email ?? '—'} />
                <DetailRow label="Teléfono" value={selected.user?.phone ?? '—'} />
              </DetailCard>

              <DetailCard title="Horarios">
                <DetailRow label="Fecha" value={selected.date} />
                <DetailRow label="Entrada" value={formatTime(selected.checkInTime)} />
                <DetailRow label="Salida" value={formatTime(selected.checkOutTime)} />
                <View className="flex-row items-center justify-between gap-3 py-0.5">
                  <Text className="text-sm text-steel-500">Estado</Text>
                  <AccessStatePill state={selected.state} />
                </View>
              </DetailCard>

              <DetailCard title="Vehículo">
                <DetailRow label="Entrada" value={vehicleFull(selected.vehicle)} />
                <DetailRow
                  label="Salida"
                  value={
                    selected.checkOutTime
                      ? vehicleFull(selected.checkOutVehicle)
                      : 'Pendiente'
                  }
                />
              </DetailCard>

              <DetailCard title="Dispositivos">
                <Text className="text-xs font-medium text-steel-500">Entrada</Text>
                <AssetList moment="CHECK_IN" access={selected} />
                <Text className="mt-2 text-xs font-medium text-steel-500">Salida</Text>
                {selected.checkOutTime ? (
                  <AssetList moment="CHECK_OUT" access={selected} />
                ) : (
                  <Text className="text-sm text-steel-400">Pendiente.</Text>
                )}
              </DetailCard>

              {selected.notes ? (
                <DetailCard title="Comentarios / notas">
                  <Text className="text-sm text-steel-200">{selected.notes}</Text>
                </DetailCard>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-card border border-ink-600 bg-ink-900 p-4 gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
        {title}
      </Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-0.5">
      <Text className="text-sm text-steel-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-steel-100">{value}</Text>
    </View>
  );
}

function AssetList({
  access,
  moment,
}: {
  access: AccessLog;
  moment: 'CHECK_IN' | 'CHECK_OUT';
}) {
  const rows = (access.accessAssets ?? []).filter((row) => row.moment === moment);

  if (rows.length === 0) {
    return <Text className="text-sm text-steel-400">Ninguno declarado.</Text>;
  }

  return (
    <View className="gap-1">
      {rows.map((row) => (
        <Text key={`${moment}-${row.id}`} className="text-sm text-steel-100">
          •{' '}
          {[row.asset?.brand?.name, row.asset?.type?.name, row.asset?.description]
            .filter(Boolean)
            .join(' · ') || `Dispositivo #${row.assetId ?? row.id}`}
        </Text>
      ))}
    </View>
  );
}
