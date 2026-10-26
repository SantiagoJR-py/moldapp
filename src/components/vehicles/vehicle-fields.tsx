import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { LinkButton } from '@/components/ui/button';
import { AlertIcon, CameraIcon, CarIcon, IdIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { palette, radius, shadows } from '@/constants/theme';
import { VEHICLE_CLASSES } from '@/constants/vehicle';
import { apiMessage } from '@/lib/api-messages';
import { ApiError } from '@/lib/http';
import { currentSurface } from '@/lib/surface';
import { normalizePlate, validateModelYear, validatePlate } from '@/lib/validation';
import {
  vehicleService,
  type CardProposal,
  type ScanResult,
  type VehicleBrand,
  type VehicleInput,
} from '@/services/vehicle.service';
import { appear } from '@/lib/motion';

const CLASS_OPTIONS: SelectOption[] = VEHICLE_CLASSES.map((name, index) => ({
  value: index + 1,
  label: name,
}));

export const UNREADABLE_CARD =
  'No pudimos leer la tarjeta. Tómala de frente, sin reflejos y con toda la tarjeta dentro de la foto.';
const VISION_OFFLINE =
  'El servicio de lectura no está disponible en este equipo. Puedes llenar los datos a mano.';

export type FormErrors = {
  plate?: string | null;
  brand?: string | null;
  line?: string | null;
  model?: string | null;
};

/** Lo que se está editando. Marca y línea van por id (catálogo) o por nombre (leído de la tarjeta). */
export type Draft = {
  plate: string;
  brandId: number | null;
  brandName: string;
  versionId: number | null;
  lineName: string;
  model: string;
  color: string;
  vehicleClass: string | null;
};

export const EMPTY_DRAFT: Draft = {
  plate: '',
  brandId: null,
  brandName: '',
  versionId: null,
  lineName: '',
  model: '',
  color: '',
  vehicleClass: null,
};

export function draftFromProposal(proposal: CardProposal): Draft {
  return {
    plate: normalizePlate(proposal.licensePlateNumber ?? ''),
    brandId: proposal.brandId,
    brandName: proposal.brandId ? '' : (proposal.brandName ?? ''),
    versionId: proposal.versionId,
    lineName: proposal.versionId ? '' : (proposal.lineName ?? ''),
    model: proposal.model ? String(proposal.model) : '',
    color: proposal.color ?? '',
    vehicleClass: proposal.vehicleClass,
  };
}

/** Una marca leída que no está en el catálogo se edita como texto, y su línea también. */
function asText(draft: Draft) {
  const brand = draft.brandId === null && draft.brandName !== '';
  return { brand, line: brand || (draft.versionId === null && draft.lineName !== '') };
}

export function validateDraft(draft: Draft): FormErrors {
  return {
    plate: validatePlate(draft.plate),
    brand: draft.brandId || draft.brandName.trim() ? null : 'Indica la marca.',
    line: draft.versionId || draft.lineName.trim() ? null : 'Indica la línea.',
    model: validateModelYear(draft.model),
  };
}

export function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.plate || errors.brand || errors.line || errors.model);
}

export function inputFromDraft(draft: Draft): VehicleInput {
  const text = asText(draft);
  return {
    licensePlateNumber: normalizePlate(draft.plate),
    ...(draft.brandId ? { brandId: draft.brandId } : { brandName: draft.brandName.trim() }),
    ...(draft.versionId && !text.brand
      ? { versionId: draft.versionId }
      : { lineName: draft.lineName.trim() }),
    model: Number(draft.model.trim()),
    color: draft.color.trim() || null,
    vehicleClass: draft.vehicleClass,
  };
}

/**
 * En web se elige la foto de la tarjeta y se lee aquí mismo. Devuelve null si la persona
 * canceló; lanza un error con el mensaje para mostrar si no se pudo leer.
 */
export async function scanCardFromLibrary(): Promise<ScanResult | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = picked.canceled ? undefined : picked.assets[0];
  if (!asset) return null;

  try {
    return await vehicleService.scanCard({
      uri: asset.uri,
      name: asset.fileName ?? 'tarjeta.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize ?? 0,
      file: asset.file,
    });
  } catch (error) {
    throw new Error(
      error instanceof ApiError && error.status === 503
        ? VISION_OFFLINE
        : apiMessage(error, 'No pudimos leer la tarjeta. Intenta de nuevo.'),
    );
  }
}

type VehicleFieldsProps = {
  draft: Draft;
  errors: FormErrors;
  /** Campos leídos de la tarjeta que la persona debe confirmar. */
  review: ReadonlySet<string>;
  brands: VehicleBrand[];
  /** `reviewed`: los campos de la tarjeta que la persona acaba de tocar (ya los revisó). */
  onChange: (changes: Partial<Draft>, reviewed: string[]) => void;
};

/** Placa, marca, línea, modelo, color y clase: lo mismo en "Mis vehículos" y en portería. */
export function VehicleFields({
  draft,
  errors,
  review,
  brands,
  onChange: update,
}: VehicleFieldsProps) {
  const brandOptions: SelectOption[] = brands.map((brand) => ({
    value: brand.id,
    label: brand.name ?? `Marca ${brand.id}`,
  }));

  const versionOptions: SelectOption[] = (
    brands.find((brand) => brand.id === draft.brandId)?.versions ?? []
  ).map((version) => ({ value: version.id, label: version.name ?? `Versión ${version.id}` }));

  const text = asText(draft);
  // Una clase leída que no está en la lista (BUSETA...) se guarda como se leyó.
  const classAsText =
    draft.vehicleClass !== null &&
    !CLASS_OPTIONS.some((option) => option.label === draft.vehicleClass);

  return (
    <>
      <Reviewed active={review.has('licensePlateNumber')} empty={!draft.plate}>
        <TextField
          label="Placa"
          value={draft.plate}
          onChangeText={(value) => update({ plate: normalizePlate(value) }, ['licensePlateNumber'])}
          error={errors.plate}
          icon={<IdIcon />}
          placeholder="ABC123"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
        />
      </Reviewed>

      <Reviewed active={review.has('brandName')} empty={!draft.brandId && !draft.brandName}>
        {text.brand ? (
          <View className="gap-2">
            <TextField
              label="Marca"
              value={draft.brandName}
              onChangeText={(value) => update({ brandName: value }, ['brandName'])}
              error={errors.brand}
              icon={<CarIcon />}
              hint="No está en el catálogo: se agregará al guardar."
              autoCapitalize="characters"
            />
            <LinkButton
              label="Elegir del catálogo"
              align="left"
              onPress={() =>
                update({ brandName: '', lineName: '', versionId: null }, ['brandName'])
              }
            />
          </View>
        ) : (
          <SelectField
            label="Marca"
            placeholder="Elige la marca"
            options={brandOptions}
            value={draft.brandId}
            error={errors.brand}
            icon={<CarIcon />}
            onChange={(value) =>
              // Las versiones dependen de la marca; la anterior deja de ser válida.
              update({ brandId: value, versionId: null, lineName: '' }, ['brandName', 'lineName'])
            }
          />
        )}
      </Reviewed>

      <Reviewed active={review.has('lineName')} empty={!draft.versionId && !draft.lineName}>
        {text.line ? (
          <TextField
            label="Línea"
            value={draft.lineName}
            onChangeText={(value) => update({ lineName: value }, ['lineName'])}
            error={errors.line}
            icon={<CarIcon />}
            hint={text.brand ? undefined : 'No está en el catálogo: se agregará al guardar.'}
            autoCapitalize="characters"
          />
        ) : (
          <SelectField
            label="Línea"
            placeholder={draft.brandId ? 'Elige la línea' : 'Elige primero la marca'}
            options={versionOptions}
            value={draft.versionId}
            error={errors.line}
            icon={<CarIcon />}
            onChange={(value) => update({ versionId: value }, ['lineName'])}
          />
        )}
      </Reviewed>

      <Reviewed active={review.has('model')} empty={!draft.model}>
        <TextField
          label="Modelo (año)"
          value={draft.model}
          onChangeText={(value) => update({ model: value }, ['model'])}
          error={errors.model}
          placeholder={String(new Date().getFullYear())}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={4}
        />
      </Reviewed>

      <Reviewed active={review.has('color')} empty={!draft.color}>
        <TextField
          label="Color"
          value={draft.color}
          onChangeText={(value) => update({ color: value }, ['color'])}
          placeholder="Ej.: BLANCO"
          autoCapitalize="characters"
          maxLength={60}
        />
      </Reviewed>

      <Reviewed active={review.has('vehicleClass')} empty={!draft.vehicleClass}>
        {classAsText ? (
          <View className="gap-2">
            <TextField
              label="Clase de vehículo"
              value={draft.vehicleClass ?? ''}
              onChangeText={(value) =>
                update({ vehicleClass: value.toUpperCase() || null }, ['vehicleClass'])
              }
              hint="No está en la lista: se guardará tal como aparece en la tarjeta."
              autoCapitalize="characters"
              maxLength={30}
            />
            <LinkButton
              label="Elegir de la lista"
              align="left"
              onPress={() => update({ vehicleClass: null }, ['vehicleClass'])}
            />
          </View>
        ) : (
          <SelectField
            label="Clase de vehículo"
            placeholder="Elige la clase"
            options={CLASS_OPTIONS}
            value={
              CLASS_OPTIONS.find((option) => option.label === draft.vehicleClass)?.value ?? null
            }
            searchable={false}
            onChange={(value) =>
              update(
                {
                  vehicleClass:
                    CLASS_OPTIONS.find((option) => option.value === value)?.label ?? null,
                },
                ['vehicleClass'],
              )
            }
          />
        )}
      </Reviewed>
    </>
  );
}

/** La acción principal: que la tarjeta de propiedad llene el formulario. */
export function ScanCardButton({
  scanning,
  onPress,
  title = 'Escanear tarjeta de propiedad',
}: {
  scanning: boolean;
  onPress: () => void;
  title?: string;
}) {
  return (
    <PressableScale
      accessibilityLabel={title}
      disabled={scanning}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: radius.card,
        borderCurve: 'continuous',
        backgroundColor: palette.accent600,
        boxShadow: shadows.accent,
        paddingHorizontal: 18,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          height: 44,
          width: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.field,
          borderCurve: 'continuous',
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
        }}
      >
        {scanning ? (
          <ActivityIndicator color={palette.white} />
        ) : (
          <CameraIcon size={22} color={palette.white} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-white">
          {scanning ? 'Leyendo tarjeta…' : title}
        </Text>
        <Text className="mt-0.5 text-sm" style={{ color: 'rgba(255, 255, 255, 0.78)' }}>
          {scanning
            ? 'Esto toma unos segundos.'
            : currentSurface === 'mobile'
              ? 'Tómale una foto y llenamos los datos por ti.'
              : 'Sube una foto y llenamos los datos por ti.'}
        </Text>
      </View>
    </PressableScale>
  );
}

/**
 * Resalta un campo leído de la tarjeta que la persona debe confirmar. Si no se leyó
 * nada, pide completarlo en vez de revisarlo.
 */
function Reviewed({
  active,
  empty,
  children,
}: {
  active: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;

  return (
    <Animated.View
      entering={appear}
      style={{
        gap: 8,
        borderRadius: radius.field + 4,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.45)',
        backgroundColor: 'rgba(251, 191, 36, 0.06)',
        padding: 10,
      }}
    >
      {children}
      <View className="flex-row items-center gap-1.5">
        <AlertIcon size={14} color={palette.warning} />
        <Text className="text-xs text-state-warning">
          {empty
            ? 'No pudimos leer este dato: complétalo.'
            : 'Revisa este dato: puede estar mal leído.'}
        </Text>
      </View>
    </Animated.View>
  );
}
