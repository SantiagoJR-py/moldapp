import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CarIcon, IdIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { normalizePlate, validateModelYear, validatePlate } from '@/lib/validation';
import {
  vehicleService,
  type Vehicle,
  type VehicleBrand,
} from '@/services/vehicle.service';

type Feedback = { tone: 'success' | 'error'; message: string };

type FormErrors = {
  plate?: string | null;
  brand?: string | null;
  version?: string | null;
  model?: string | null;
};

/** `null` = formulario cerrado, `'new'` = alta, número = edición de ese vehículo. */
type FormTarget = null | 'new' | number;

export default function VehiclesScreen() {
  const insets = useSafeAreaInsets();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [target, setTarget] = useState<FormTarget>(null);
  const [plate, setPlate] = useState('');
  const [brandId, setBrandId] = useState<number | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [model, setModel] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [mine, catalog] = await Promise.all([
        vehicleService.mine(),
        vehicleService.brands(),
      ]);

      setVehicles(mine);
      setBrands(catalog);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: apiMessage(error, 'No pudimos cargar tus vehículos.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const brandOptions: SelectOption[] = brands.map((brand) => ({
    value: brand.id,
    label: brand.name ?? `Marca ${brand.id}`,
  }));

  const versionOptions: SelectOption[] = (
    brands.find((brand) => brand.id === brandId)?.versions ?? []
  ).map((version) => ({
    value: version.id,
    label: version.name ?? `Versión ${version.id}`,
  }));

  function closeForm() {
    setTarget(null);
    setErrors({});
  }

  function openCreate() {
    setFeedback(null);
    setConfirmingDelete(null);
    setPlate('');
    setBrandId(null);
    setVersionId(null);
    setModel('');
    setErrors({});
    setTarget('new');
  }

  function openEdit(vehicle: Vehicle) {
    setFeedback(null);
    setConfirmingDelete(null);
    setPlate(vehicle.licensePlateNumber);
    setBrandId(vehicle.brandId);
    setVersionId(vehicle.versionId);
    setModel(String(vehicle.model));
    setErrors({});
    setTarget(vehicle.id);
  }

  async function onSubmit() {
    const nextErrors: FormErrors = {
      plate: validatePlate(plate),
      brand: brandId ? null : 'Elige la marca.',
      version: versionId ? null : 'Elige la versión.',
      model: validateModelYear(model),
    };

    setErrors(nextErrors);
    setFeedback(null);

    if (nextErrors.plate || nextErrors.brand || nextErrors.version || nextErrors.model) return;

    const input = {
      licensePlateNumber: normalizePlate(plate),
      brandId: brandId as number,
      versionId: versionId as number,
      model: Number(model.trim()),
    };

    setSaving(true);

    try {
      if (target === 'new') {
        const created = await vehicleService.create(input);
        setVehicles((current) => [created, ...current]);
        setFeedback({ tone: 'success', message: 'Vehículo agregado.' });
      } else if (typeof target === 'number') {
        const updated = await vehicleService.update(target, input);
        setVehicles((current) =>
          current.map((vehicle) => (vehicle.id === target ? updated : vehicle)),
        );
        setFeedback({ tone: 'success', message: 'Vehículo actualizado.' });
      }

      closeForm();
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: apiMessage(error, 'No pudimos guardar el vehículo.'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setFeedback(null);
    setDeleting(id);

    try {
      await vehicleService.remove(id);
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
      setConfirmingDelete(null);
      if (target === id) closeForm();
      setFeedback({ tone: 'success', message: 'Vehículo eliminado.' });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: apiMessage(error, 'No pudimos eliminar el vehículo.'),
      });
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={palette.accent400} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 20 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-semibold text-white">Mis vehículos</Text>
        <Text className="text-sm text-steel-400">
          Registra los vehículos con los que ingresas. Portería los usa para validar tu acceso.
        </Text>
      </View>

      {feedback ? <Banner tone={feedback.tone} message={feedback.message} /> : null}

      {target === null ? (
        <Pressable
          accessibilityRole="button"
          onPress={openCreate}
          className="flex-row items-center justify-center gap-2 rounded-field border border-dashed border-ink-600 bg-ink-900 py-4 active:bg-ink-800"
        >
          <PlusIcon size={18} color={palette.accent300} />
          <Text className="text-sm font-medium text-accent-300">Agregar vehículo</Text>
        </Pressable>
      ) : (
        <View className="gap-5 rounded-card border border-accent-500/30 bg-ink-900 p-5">
          <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
            {target === 'new' ? 'Nuevo vehículo' : 'Editar vehículo'}
          </Text>

          <TextField
            label="Placa"
            value={plate}
            onChangeText={(value) => setPlate(normalizePlate(value))}
            error={errors.plate}
            icon={<IdIcon />}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />

          <SelectField
            label="Marca"
            placeholder="Elige la marca"
            options={brandOptions}
            value={brandId}
            error={errors.brand}
            icon={<CarIcon />}
            onChange={(value) => {
              setBrandId(value);
              // Las versiones dependen de la marca; la anterior deja de ser válida.
              setVersionId(null);
            }}
          />

          <SelectField
            label="Versión"
            placeholder={brandId ? 'Elige la versión' : 'Elige primero la marca'}
            options={versionOptions}
            value={versionId}
            error={errors.version}
            icon={<CarIcon />}
            onChange={setVersionId}
          />

          <TextField
            label="Modelo"
            value={model}
            onChangeText={setModel}
            error={errors.model}
            placeholder={String(new Date().getFullYear())}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
          />

          <View className="gap-3">
            <Button
              label={target === 'new' ? 'Agregar vehículo' : 'Guardar cambios'}
              loading={saving}
              onPress={() => void onSubmit()}
            />
            <Button label="Cancelar" variant="outline" disabled={saving} onPress={closeForm} />
          </View>
        </View>
      )}

      {vehicles.length === 0 ? (
        <View className="items-center gap-3 rounded-card border border-ink-600 bg-ink-900 px-5 py-10">
          <CarIcon size={32} color={palette.steel500} />
          <Text className="text-center text-sm text-steel-400">
            Todavía no tienes vehículos registrados.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              confirming={confirmingDelete === vehicle.id}
              deleting={deleting === vehicle.id}
              onEdit={() => openEdit(vehicle)}
              onAskDelete={() => setConfirmingDelete(vehicle.id)}
              onCancelDelete={() => setConfirmingDelete(null)}
              onConfirmDelete={() => void onDelete(vehicle.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

type VehicleCardProps = {
  vehicle: Vehicle;
  confirming: boolean;
  deleting: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

function VehicleCard({
  vehicle,
  confirming,
  deleting,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: VehicleCardProps) {
  const description = [vehicle.brand?.name, vehicle.version?.name].filter(Boolean).join(' · ');

  return (
    <View className="gap-4 rounded-card border border-ink-600 bg-ink-900 p-4">
      <View className="flex-row items-center gap-4">
        <View className="h-11 w-11 items-center justify-center rounded-field bg-accent-500/10">
          <CarIcon size={22} color={palette.accent300} />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold tracking-wider text-white">
            {vehicle.licensePlateNumber}
          </Text>
          <Text className="mt-0.5 text-sm text-steel-400">
            {description || 'Sin marca registrada'} · {vehicle.model}
          </Text>
        </View>

        {confirming ? null : (
          <View className="flex-row gap-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar vehículo ${vehicle.licensePlateNumber}`}
              hitSlop={6}
              onPress={onEdit}
              className="h-9 w-9 items-center justify-center rounded-field active:bg-ink-800"
            >
              <PencilIcon size={18} color={palette.steel400} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Eliminar vehículo ${vehicle.licensePlateNumber}`}
              hitSlop={6}
              onPress={onAskDelete}
              className="h-9 w-9 items-center justify-center rounded-field active:bg-ink-800"
            >
              <TrashIcon size={18} color={palette.steel400} />
            </Pressable>
          </View>
        )}
      </View>

      {confirming ? (
        <View className="gap-3 rounded-field border border-state-danger/40 bg-state-danger/10 p-3">
          <Text className="text-sm text-steel-200">
            ¿Eliminar la placa {vehicle.licensePlateNumber}?
          </Text>

          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onConfirmDelete}
              className="h-10 flex-1 flex-row items-center justify-center rounded-field bg-state-danger active:opacity-80"
            >
              {deleting ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <Text className="text-sm font-semibold text-white">Eliminar</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onCancelDelete}
              className="h-10 flex-1 items-center justify-center rounded-field border border-ink-600 bg-ink-800 active:opacity-80"
            >
              <Text className="text-sm font-medium text-steel-200">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
