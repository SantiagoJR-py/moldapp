import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CarIcon } from '@/components/ui/icons';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { RolePill, UserStatePill } from '@/components/ui/status-pills';
import { roleLabel } from '@/constants/roles';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { apiMessage } from '@/lib/api-messages';
import {
  accessService,
  type AccessLog,
  type AccessPagination,
} from '@/services/access.service';
import {
  adminUserService,
  type AdminRole,
  type AdminUserDetail,
} from '@/services/admin-user.service';
import type { Vehicle } from '@/services/vehicle.service';

const ACCESS_PAGE_SIZE = 8;

function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function vehicleLabel(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Sin vehículo';
  return [vehicle.brand?.name, vehicle.version?.name, vehicle.licensePlateNumber]
    .filter(Boolean)
    .join(' ');
}

export default function AdminUserDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user: sessionUser } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const isSelf = sessionUser?.id === userId;

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  const [showAccesses, setShowAccesses] = useState(false);
  const [accesses, setAccesses] = useState<AccessLog[]>([]);
  const [accessPagination, setAccessPagination] = useState<AccessPagination | null>(null);
  const [accessPage, setAccessPage] = useState(1);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const roleOptions: SelectOption[] = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label: roleLabel(role.name),
      })),
    [roles],
  );

  const roleDirty =
    selectedRoleId != null &&
    detail?.user.roleId != null &&
    selectedRoleId !== detail.user.roleId;

  const loadDetail = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const [response, rolesResponse] = await Promise.all([
        adminUserService.one(userId),
        adminUserService.roles(),
      ]);
      setDetail(response);
      setRoles(rolesResponse.roles);
      setSelectedRoleId(response.user.roleId);
    } catch (err) {
      setError(apiMessage(err, 'No pudimos cargar el usuario.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadAccesses = useCallback(
    async (page = 1) => {
      if (!userId) return;

      setAccessLoading(true);
      setAccessError(null);

      try {
        const response = await accessService.adminList({
          userId,
          page,
          pageSize: ACCESS_PAGE_SIZE,
        });
        setAccesses(response.accesses);
        setAccessPagination(response.pagination);
        setAccessPage(response.pagination.page);
        setShowAccesses(true);
      } catch (err) {
        setAccessError(apiMessage(err, 'No pudimos cargar los ingresos de esta persona.'));
      } finally {
        setAccessLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function onSaveRole() {
    if (!selectedRoleId || !detail || isSelf) return;

    setSavingRole(true);
    setRoleError(null);
    setRoleFeedback(null);

    try {
      const updated = await adminUserService.updateRole(detail.user.id, selectedRoleId);
      setDetail(updated);
      setSelectedRoleId(updated.user.roleId);
      setRoleFeedback(`Rol actualizado a ${roleLabel(updated.user.role?.name)}.`);
    } catch (err) {
      setRoleError(apiMessage(err, 'No pudimos cambiar el rol.'));
    } finally {
      setSavingRole(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-950">
        <ActivityIndicator color={palette.accent400} />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View className="flex-1 bg-ink-950 p-5">
        <Banner tone="error" message={error ?? 'Usuario no encontrado.'} />
      </View>
    );
  }

  const { user } = detail;
  const accessTotalPages = accessPagination?.totalPages ?? 1;

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 14 }}
    >
      <View className="gap-2">
        <Text className="text-2xl font-semibold text-white">{user.fullName}</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <RolePill roleName={user.role?.name} />
          <UserStatePill state={user.state} />
        </View>
      </View>

      {detail.openAccess ? (
        <Banner
          tone="success"
          message={`Ahora mismo está dentro del campus (ingreso #${detail.openAccess.id}, ${formatTime(detail.openAccess.checkInTime)}).`}
        />
      ) : null}

      <Card title="Datos">
        <Row
          label="Documento"
          value={`${user.identificationType?.name ?? 'Doc.'} ${user.identification ?? '—'}`}
        />
        <Row label="Correo" value={user.email ?? '—'} />
        <Row label="Teléfono" value={user.phone ?? '—'} />
        <View className="flex-row items-center justify-between gap-3 py-0.5">
          <Text className="text-sm text-steel-500">Estado</Text>
          <UserStatePill state={user.state} />
        </View>
        <Row label="Ingresos totales" value={String(detail.accessCount)} />
      </Card>

      <Card title="Rol">
        <View className="mb-2 flex-row flex-wrap items-center gap-2">
          <Text className="text-sm text-steel-400">Rol actual:</Text>
          <RolePill roleName={user.role?.name} />
        </View>

        {isSelf ? (
          <Banner
            tone="error"
            message="No puedes cambiar tu propio rol desde aquí. Pídeselo a otro administrador."
          />
        ) : (
          <View className="gap-3">
            <SelectField
              label="Nuevo rol"
              placeholder="Elige un rol"
              options={roleOptions}
              value={selectedRoleId}
              onChange={setSelectedRoleId}
            />
            {roleError ? <Banner tone="error" message={roleError} /> : null}
            {roleFeedback ? <Banner tone="success" message={roleFeedback} /> : null}
            <Button
              label="Guardar rol"
              loading={savingRole}
              disabled={!roleDirty}
              onPress={() => void onSaveRole()}
            />
          </View>
        )}
      </Card>

      <Card title="Vehículos registrados">
        {detail.vehicles.length === 0 ? (
          <Text className="text-sm text-steel-400">Sin vehículos asociados.</Text>
        ) : (
          detail.vehicles.map((vehicle) => (
            <View key={vehicle.id} className="flex-row items-center gap-2 py-1">
              <CarIcon size={16} color={palette.accent300} />
              <Text className="flex-1 text-sm text-steel-100">{vehicleLabel(vehicle)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Dispositivos registrados">
        {detail.assets.length === 0 ? (
          <Text className="text-sm text-steel-400">Sin dispositivos asociados.</Text>
        ) : (
          detail.assets.map((asset) => (
            <Text key={asset.id} className="py-0.5 text-sm text-steel-100">
              • {[asset.brand?.name, asset.type?.name, asset.description].filter(Boolean).join(' · ')}
            </Text>
          ))
        )}
      </Card>

      <Card title="Uso frecuente">
        <Text className="mb-1 text-xs font-medium text-steel-500">Vehículos</Text>
        {detail.frequentVehicles.length === 0 ? (
          <Text className="mb-3 text-sm text-steel-400">Aún no hay historial de vehículos.</Text>
        ) : (
          detail.frequentVehicles.map((row) => (
            <Text key={row.vehicle.id} className="py-0.5 text-sm text-steel-100">
              • {vehicleLabel(row.vehicle)} · {row.uses} vez{row.uses === 1 ? '' : 'es'}
            </Text>
          ))
        )}

        <Text className="mb-1 mt-2 text-xs font-medium text-steel-500">Dispositivos</Text>
        {detail.frequentAssets.length === 0 ? (
          <Text className="text-sm text-steel-400">Aún no hay historial de dispositivos.</Text>
        ) : (
          detail.frequentAssets.map((row) => (
            <Text key={row.asset.id} className="py-0.5 text-sm text-steel-100">
              • {[row.asset.brand?.name, row.asset.type?.name, row.asset.description]
                .filter(Boolean)
                .join(' · ')}{' '}
              · {row.uses} vez{row.uses === 1 ? '' : 'es'}
            </Text>
          ))
        )}
      </Card>

      <View className="gap-3">
        <Button
          label={showAccesses ? 'Actualizar ingresos' : 'Ver registros de ingreso'}
          onPress={() => void loadAccesses(1)}
          loading={accessLoading}
        />

        {accessError ? <Banner tone="error" message={accessError} /> : null}

        {showAccesses ? (
          <View className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
              Historial de ingresos
            </Text>

            {accesses.length === 0 ? (
              <Text className="text-sm text-steel-400">Esta persona aún no tiene ingresos.</Text>
            ) : (
              accesses.map((access) => (
                <View
                  key={access.id}
                  className="rounded-card border border-ink-600 bg-ink-900 px-4 py-3 gap-1"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-steel-500">#{access.id}</Text>
                    <Text
                      className={`text-[10px] font-medium ${
                        access.state === 'INSIDE' ? 'text-accent-300' : 'text-steel-400'
                      }`}
                    >
                      {access.state === 'INSIDE' ? 'Dentro' : 'Fuera'}
                    </Text>
                  </View>
                  <Text className="text-sm text-steel-100">
                    {access.date} · In {formatTime(access.checkInTime)} · Out{' '}
                    {formatTime(access.checkOutTime)}
                  </Text>
                  <Text className="text-xs text-steel-500">
                    {access.vehicle
                      ? `Con vehículo ${access.vehicle.licensePlateNumber}`
                      : 'Sin vehículo'}
                  </Text>
                </View>
              ))
            )}

            {accessPagination && accessPagination.total > 0 ? (
              <View className="gap-2">
                <Text className="text-center text-xs text-steel-500">
                  Página {accessPagination.page} de {accessPagination.totalPages} ·{' '}
                  {accessPagination.total} registros
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label="Anterior"
                      variant="outline"
                      disabled={accessPage <= 1 || accessLoading}
                      onPress={() => void loadAccesses(accessPage - 1)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Siguiente"
                      variant="outline"
                      disabled={accessPage >= accessTotalPages || accessLoading}
                      onPress={() => void loadAccesses(accessPage + 1)}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            <Pressable onPress={() => setShowAccesses(false)}>
              <Text className="text-center text-sm text-steel-500">Ocultar historial</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-card border border-ink-600 bg-ink-900 p-4 gap-2">
      <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-0.5">
      <Text className="text-sm text-steel-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-steel-100">{value}</Text>
    </View>
  );
}
