import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, IdIcon, UserIcon } from '@/components/ui/icons';
import { RolePill, UserStatePill } from '@/components/ui/status-pills';
import { TextField } from '@/components/ui/text-field';
import { RoleName } from '@/constants/roles';
import { palette } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { routes } from '@/lib/routes';
import {
  adminUserService,
  type AdminUser,
  type AdminUserPagination,
} from '@/services/admin-user.service';

const PAGE_SIZE = 20;

type ChipOption = { value: string; label: string };

const ROLE_CHIPS: ChipOption[] = [
  { value: '', label: 'Todos' },
  { value: RoleName.STUDENT, label: 'Estudiante' },
  { value: RoleName.TEACHER, label: 'Docente' },
  { value: RoleName.STAFF, label: 'Personal' },
  { value: RoleName.ADMINISTRATIVE_STAFF, label: 'Admin' },
  { value: RoleName.WARDEN, label: 'Portería' },
  { value: RoleName.EXTERNAL_PERSONS, label: 'Externo' },
];

const STATE_CHIPS: ChipOption[] = [
  { value: '', label: 'Todos' },
  { value: 'ENABLED', label: 'Activos' },
  { value: 'DISABLED', label: 'Inactivos' },
];

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
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
                key={option.value || 'all'}
                onPress={() => onChange(option.value)}
                className={`rounded-field border px-3 py-2 ${
                  active ? 'border-accent-400 bg-accent-400/15' : 'border-ink-600 bg-ink-950'
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

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [role, setRole] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminUserPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(
    () => JSON.stringify({ name, identification, role, state }),
    [name, identification, role, state],
  );

  const load = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminUserService.list({
          page: nextPage,
          pageSize: PAGE_SIZE,
          name: name.trim() || undefined,
          identification: identification.trim() || undefined,
          role: role || undefined,
          state: state || undefined,
        });
        setUsers(response.users);
        setPagination(response.pagination);
        setPage(response.pagination.page);
      } catch (err) {
        setError(apiMessage(err, 'No pudimos cargar los usuarios.'));
      } finally {
        setLoading(false);
      }
    },
    [page, name, identification, role, state],
  );

  useEffect(() => {
    setPage(1);
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 14 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-semibold text-white">Usuarios</Text>
        <Text className="text-sm leading-5 text-steel-400">
          Consulta personas por rol o documento. Entra al detalle para ver ingresos, vehículos y
          dispositivos frecuentes.
        </Text>
      </View>

      {error ? <Banner tone="error" message={error} /> : null}

      <View className="rounded-card border border-ink-600 bg-ink-900 p-4 gap-4">
        <TextField
          label="Nombre"
          placeholder="Buscar por nombre"
          value={name}
          onChangeText={setName}
          icon={<UserIcon />}
        />
        <TextField
          label="Cédula / documento"
          placeholder="Sin puntos"
          value={identification}
          onChangeText={setIdentification}
          icon={<IdIcon />}
          keyboardType="number-pad"
        />
        <ChipRow label="Rol" options={ROLE_CHIPS} value={role} onChange={setRole} />
        <ChipRow label="Estado" options={STATE_CHIPS} value={state} onChange={setState} />
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={palette.accent400} />
        </View>
      ) : null}

      {!loading && users.length === 0 ? (
        <View className="rounded-card border border-ink-600 bg-ink-900 p-5">
          <Text className="text-sm text-steel-400">No hay usuarios con esos filtros.</Text>
        </View>
      ) : null}

      {users.map((user) => (
        <Pressable
          key={user.id}
          accessibilityRole="button"
          onPress={() => router.push(routes.adminUserDetail(user.id))}
          className="rounded-card border border-ink-600 bg-ink-900 px-4 py-4 active:bg-ink-800"
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-base font-medium text-steel-100">{user.fullName}</Text>
              <View className="flex-row flex-wrap items-center gap-2">
                <RolePill roleName={user.role?.name} />
                <UserStatePill state={user.state} />
              </View>
              <Text className="text-sm text-steel-400">
                {user.identificationType?.name ?? 'Doc.'} {user.identification ?? '—'}
              </Text>
              {user.email ? (
                <Text className="text-xs text-steel-500">{user.email}</Text>
              ) : null}
            </View>
            <ChevronRightIcon size={18} color={palette.steel500} />
          </View>
        </Pressable>
      ))}

      {pagination && pagination.total > 0 ? (
        <View className="rounded-card border border-ink-600 bg-ink-900 p-4 gap-3">
          <Text className="text-center text-sm text-steel-400">
            Página {pagination.page} de {pagination.totalPages} · {pagination.total} usuarios
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
  );
}
