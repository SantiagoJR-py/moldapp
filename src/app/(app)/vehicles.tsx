import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CarIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import {
  draftFromProposal,
  EMPTY_DRAFT,
  hasErrors,
  inputFromDraft,
  ScanCardButton,
  scanCardFromLibrary,
  UNREADABLE_CARD,
  validateDraft,
  VehicleFields,
  type Draft,
  type FormErrors,
} from '@/components/vehicles/vehicle-fields';
import { palette, radius, shadows } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { clearScan, peekScan } from '@/lib/scan-store';
import { currentSurface } from '@/lib/surface';
import {
  vehicleService,
  type ScanResult,
  type Vehicle,
  type VehicleBrand,
} from '@/services/vehicle.service';
import { appear, vanish, settle } from '@/lib/motion';

type Feedback = { tone: 'success' | 'error' | 'info'; message: string };

/**
 * Las filas se reacomodan solas al agregar o borrar en vez de saltar. Es la
 * animacion que mas hace por la sensacion de calidad en una lista.
 */
/** Tarjeta base de la lista y del formulario. */
const card = {
  borderRadius: radius.card,
  borderCurve: 'continuous',
  borderWidth: 1,
  borderColor: palette.hairline,
  backgroundColor: palette.ink800,
  boxShadow: shadows.card,
} as const;

/** `null` = formulario cerrado, `'new'` = alta, número = edición de ese vehículo. */
type FormTarget = null | 'new' | number;

export default function VehiclesScreen() {
  const insets = useSafeAreaInsets();
  // Al volver de la cámara (celular) la tarjeta ya leída abre el formulario lleno.
  const [returned] = useState(() => peekScan('vehicles'));

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [target, setTarget] = useState<FormTarget>(returned ? 'new' : null);
  const [draft, setDraft] = useState<Draft>(() =>
    returned ? draftFromProposal(returned.proposal) : EMPTY_DRAFT,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Lo que vino de la tarjeta de propiedad: campos por revisar y placa ya registrada.
  const [review, setReview] = useState<Set<string>>(() => new Set(returned?.review ?? []));
  const [plateTaken, setPlateTaken] = useState(Boolean(returned?.plateTaken));
  const [fromCard, setFromCard] = useState(Boolean(returned));
  const [scanning, setScanning] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(
    () =>
      Promise.all([vehicleService.mine(), vehicleService.brands()])
        .then(([mine, catalog]) => {
          setVehicles(mine);
          setBrands(catalog);
        })
        .catch((error: unknown) => {
          setFeedback({
            tone: 'error',
            message: apiMessage(error, 'No pudimos cargar tus vehículos.'),
          });
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    clearScan('vehicles');
    void load();
  }, [load]);

  const applyScan = useCallback((result: ScanResult) => {
    if (!result.readable) {
      setFeedback({ tone: 'error', message: UNREADABLE_CARD });
      return;
    }

    setConfirmingDelete(null);
    setDraft(draftFromProposal(result.proposal));
    setReview(new Set(result.review));
    setPlateTaken(result.plateTaken);
    setFromCard(true);
    setErrors({});
    setFeedback(null);
    setTarget('new');
  }, []);

  function update(changes: Partial<Draft>, reviewed: string[]) {
    setDraft((current) => ({ ...current, ...changes }));
    // Si la persona tocó el dato, ya lo revisó.
    setReview((current) => {
      const next = new Set(current);
      reviewed.forEach((name) => next.delete(name));
      return next;
    });
  }

  function closeForm() {
    setTarget(null);
    setErrors({});
    setReview(new Set());
    setPlateTaken(false);
    setFromCard(false);
  }

  function openCreate() {
    setFeedback(null);
    setConfirmingDelete(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setReview(new Set());
    setPlateTaken(false);
    setFromCard(false);
    setTarget('new');
  }

  function openEdit(vehicle: Vehicle) {
    setFeedback(null);
    setConfirmingDelete(null);
    setDraft({
      plate: vehicle.licensePlateNumber,
      brandId: vehicle.brandId,
      brandName: '',
      versionId: vehicle.versionId,
      lineName: '',
      model: String(vehicle.model),
      color: vehicle.color ?? '',
      vehicleClass: vehicle.vehicleClass,
    });
    setErrors({});
    setReview(new Set());
    setPlateTaken(false);
    setFromCard(false);
    setTarget(vehicle.id);
  }

  async function scanCard() {
    // En el celular se usa la cámara con marco guía; en web se elige la foto.
    if (currentSurface === 'mobile') {
      router.push('/scan-card');
      return;
    }

    setFeedback(null);
    setScanning(true);

    try {
      const result = await scanCardFromLibrary();
      if (result) applyScan(result);
    } catch (error) {
      setFeedback({ tone: 'error', message: (error as Error).message });
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit() {
    const nextErrors = validateDraft(draft);

    setErrors(nextErrors);
    setFeedback(null);

    if (hasErrors(nextErrors)) return;

    const input = inputFromDraft(draft);

    setSaving(true);

    try {
      if (target === 'new') {
        const created = await vehicleService.create(input);
        setVehicles((current) => [created, ...current]);
        setFeedback({ tone: 'success', message: 'Vehículo agregado.' });
        // La marca o línea nueva ya quedó en el catálogo.
        if (!input.brandId || !input.versionId) void load();
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
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator color={palette.accent400} />
        <Text className="text-sm text-steel-400">Cargando tus vehículos…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Animated.View entering={appear} style={{ gap: 6 }}>
        <Text className="text-3xl font-bold tracking-tight text-steel-100">Mis vehículos</Text>
        <Text className="text-sm leading-5 text-steel-300">
          Registra los vehículos con los que ingresas. Portería los usa para validar tu acceso.
        </Text>
      </Animated.View>

      {feedback ? <Banner tone={feedback.tone} message={feedback.message} /> : null}

      {target === null ? (
        <Animated.View entering={appear} layout={settle} style={{ gap: 12 }}>
          <ScanCardButton scanning={scanning} onPress={() => void scanCard()} />

          <PressableScale
            accessibilityLabel="Llenar los datos a mano"
            disabled={scanning}
            onPress={openCreate}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: radius.field,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: palette.ink600,
              backgroundColor: palette.ink800,
              paddingVertical: 15,
            }}
          >
            <PlusIcon size={18} color={palette.accent400} />
            <Text className="text-sm font-medium text-accent-400">Llenar a mano</Text>
          </PressableScale>
        </Animated.View>
      ) : (
        <Animated.View
          entering={appear}
          exiting={vanish}
          layout={settle}
          style={[card, { gap: 20, borderColor: 'rgba(61, 143, 245, 0.32)', padding: 20 }]}
        >
          <Text className="text-base font-semibold text-steel-100">
            {target !== 'new'
              ? 'Editar vehículo'
              : fromCard
                ? 'Datos leídos de la tarjeta'
                : 'Nuevo vehículo'}
          </Text>

          {fromCard ? (
            <Text className="text-sm leading-5 text-steel-300">
              {review.size > 0
                ? 'Revisa los datos marcados en amarillo: pueden estar mal leídos. Luego guarda.'
                : 'Confirma que los datos coinciden con tu tarjeta y guarda.'}
            </Text>
          ) : null}

          {plateTaken ? (
            <Banner tone="error" message="Esta placa ya está registrada en ENTRYX." />
          ) : null}

          <VehicleFields
            draft={draft}
            errors={errors}
            review={review}
            brands={brands}
            onChange={update}
          />

          <View className="gap-3">
            <Button
              label={target === 'new' ? 'Guardar vehículo' : 'Guardar cambios'}
              loading={saving}
              onPress={() => void onSubmit()}
            />
            <Button label="Cancelar" variant="outline" disabled={saving} onPress={closeForm} />
          </View>
        </Animated.View>
      )}

      {vehicles.length === 0 ? (
        <Animated.View
          entering={appear}
          layout={settle}
          style={[
            card,
            { alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 40 },
          ]}
        >
          <CarIcon size={32} color={palette.steel500} />
          <Text className="text-center text-sm text-steel-300">
            Todavía no tienes vehículos registrados.
          </Text>
        </Animated.View>
      ) : (
        <View className="gap-3">
          {vehicles.map((vehicle, index) => (
            <Animated.View key={vehicle.id} entering={appear} exiting={vanish} layout={settle}>
              <VehicleCard
                vehicle={vehicle}
                confirming={confirmingDelete === vehicle.id}
                deleting={deleting === vehicle.id}
                onEdit={() => openEdit(vehicle)}
                onAskDelete={() => setConfirmingDelete(vehicle.id)}
                onCancelDelete={() => setConfirmingDelete(null)}
                onConfirmDelete={() => void onDelete(vehicle.id)}
              />
            </Animated.View>
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
  const details = [vehicle.vehicleClass, vehicle.color].filter(Boolean).join(' · ');

  const iconButton = {
    height: 38,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    borderCurve: 'continuous',
    backgroundColor: palette.ink700,
  } as const;

  return (
    <Animated.View layout={settle} style={[card, { gap: 16, padding: 16 }]}>
      <View className="flex-row items-center gap-4">
        <View
          style={{
            height: 46,
            width: 46,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.field,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(47, 128, 237, 0.14)',
          }}
        >
          <CarIcon size={22} color={palette.accent400} />
        </View>

        <View className="flex-1">
          {/* La placa es el dato que se busca de un vistazo: va con el mayor peso. */}
          <Text className="text-lg font-bold tracking-widest text-steel-100">
            {vehicle.licensePlateNumber}
          </Text>
          <Text className="mt-0.5 text-sm text-steel-300">
            {description || 'Sin marca registrada'} · {vehicle.model}
          </Text>
          {details ? <Text className="mt-0.5 text-xs text-steel-400">{details}</Text> : null}
        </View>

        {confirming ? null : (
          <Animated.View entering={appear} style={{ flexDirection: 'row', gap: 8 }}>
            <PressableScale
              accessibilityLabel={`Editar vehículo ${vehicle.licensePlateNumber}`}
              depth={0.9}
              onPress={onEdit}
              style={iconButton}
            >
              <PencilIcon size={18} color={palette.steel300} />
            </PressableScale>

            <PressableScale
              accessibilityLabel={`Eliminar vehículo ${vehicle.licensePlateNumber}`}
              depth={0.9}
              onPress={onAskDelete}
              style={iconButton}
            >
              <TrashIcon size={18} color={palette.steel300} />
            </PressableScale>
          </Animated.View>
        )}
      </View>

      {confirming ? (
        <Animated.View
          entering={appear}
          exiting={vanish}
          style={{
            gap: 12,
            borderRadius: radius.field,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: 'rgba(251, 113, 133, 0.38)',
            backgroundColor: 'rgba(251, 113, 133, 0.10)',
            padding: 14,
          }}
        >
          <Text className="text-sm text-steel-200">
            ¿Eliminar la placa {vehicle.licensePlateNumber}?
          </Text>

          <View className="flex-row gap-2">
            <PressableScale
              accessibilityLabel={`Confirmar eliminación de ${vehicle.licensePlateNumber}`}
              disabled={deleting}
              onPress={onConfirmDelete}
              style={{
                height: 44,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.field,
                borderCurve: 'continuous',
                backgroundColor: palette.danger,
              }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={palette.ink950} />
              ) : (
                <Text className="text-sm font-semibold text-ink-950">Eliminar</Text>
              )}
            </PressableScale>

            <PressableScale
              accessibilityLabel="Cancelar"
              disabled={deleting}
              onPress={onCancelDelete}
              style={{
                height: 44,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.field,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: palette.ink600,
                backgroundColor: palette.ink700,
              }}
            >
              <Text className="text-sm font-medium text-steel-200">Cancelar</Text>
            </PressableScale>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
