import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeScannerModal } from '@/components/app/barcode-scanner-modal';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { IdIcon } from '@/components/ui/icons';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { roleLabel } from '@/constants/roles';
import { apiMessage } from '@/lib/api-messages';
import { normalizePlate, validateModelYear, validatePlate } from '@/lib/validation';
import {
  accessService,
  type AccessLog,
  type SuggestedAsset,
} from '@/services/access.service';
import { assetService, type AssetBrand } from '@/services/asset.service';
import type { AuthUser } from '@/services/auth.service';
import { vehicleService, type Vehicle, type VehicleBrand } from '@/services/vehicle.service';

const UNLISTED_BRAND = 'Otro (no catalogado)';

function vehicleTitle(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Sin vehículo';
  const name = `${vehicle.brand?.name ?? ''} ${vehicle.version?.name ?? ''}`.trim();
  return name || 'Vehículo';
}

function vehicleHint(vehicle: Vehicle): string {
  return `Placa ${vehicle.licensePlateNumber} · ${vehicle.model}`;
}

function assetIdsFromAccess(access: AccessLog, moment: 'CHECK_IN' | 'CHECK_OUT'): number[] {
  return (access.accessAssets ?? [])
    .filter((row) => row.moment === moment)
    .map((row) => row.assetId ?? row.asset?.id)
    .filter((id): id is number => typeof id === 'number');
}

function assetsFromAccess(access: AccessLog, moment: 'CHECK_IN' | 'CHECK_OUT') {
  return (access.accessAssets ?? [])
    .filter((row) => row.moment === moment)
    .map((row) => row.asset)
    .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
}

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();

  const [identification, setIdentification] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [openAccess, setOpenAccess] = useState<AccessLog | null>(null);
  const [suggestedVehicles, setSuggestedVehicles] = useState<Vehicle[]>([]);
  const [suggestedAssets, setSuggestedAssets] = useState<SuggestedAsset[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [walkIn, setWalkIn] = useState(true);
  const [addNewVehicle, setAddNewVehicle] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [addNewAsset, setAddNewAsset] = useState(false);

  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [plate, setPlate] = useState('');
  const [vehicleBrandId, setVehicleBrandId] = useState<number | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [model, setModel] = useState('');

  const [assetBrands, setAssetBrands] = useState<AssetBrand[]>([]);
  const [assetBrandId, setAssetBrandId] = useState<number | null>(null);
  const [assetTypeId, setAssetTypeId] = useState<number | null>(null);
  const [assetDescription, setAssetDescription] = useState('');

  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  /** Selección para la salida (misma pantalla). */
  const [exitVehicleId, setExitVehicleId] = useState<number | null>(null);
  const [exitWalkIn, setExitWalkIn] = useState(true);
  const [exitAssetIds, setExitAssetIds] = useState<number[]>([]);

  useEffect(() => {
    void vehicleService.brands().then(setVehicleBrands).catch(() => undefined);
    void assetService.brands().then(setAssetBrands).catch(() => undefined);
  }, []);

  const vehicleBrandOptions: SelectOption[] = useMemo(
    () =>
      vehicleBrands.map((brand) => ({
        value: brand.id,
        label: brand.name ?? `Marca ${brand.id}`,
      })),
    [vehicleBrands],
  );

  const versionOptions: SelectOption[] = useMemo(() => {
    const brand = vehicleBrands.find((item) => item.id === vehicleBrandId);
    return (brand?.versions ?? []).map((version) => ({
      value: version.id,
      label: version.name ?? `Versión ${version.id}`,
    }));
  }, [vehicleBrandId, vehicleBrands]);

  const assetBrandOptions: SelectOption[] = useMemo(
    () =>
      assetBrands.map((brand) => ({
        value: brand.id,
        label: brand.name ?? `Marca ${brand.id}`,
      })),
    [assetBrands],
  );

  const assetTypeOptions: SelectOption[] = useMemo(() => {
    const brand = assetBrands.find((item) => item.id === assetBrandId);
    return (brand?.types ?? []).map((type) => ({
      value: type.id,
      label: type.name ?? `Tipo ${type.id}`,
    }));
  }, [assetBrandId, assetBrands]);

  const unlistedBrandId = useMemo(
    () => assetBrands.find((brand) => brand.name === UNLISTED_BRAND)?.id ?? null,
    [assetBrands],
  );

  const exitVehicleOptions = useMemo(() => {
    const map = new Map<number, Vehicle>();
    if (openAccess?.vehicle) map.set(openAccess.vehicle.id, openAccess.vehicle);
    for (const vehicle of suggestedVehicles) map.set(vehicle.id, vehicle);
    return [...map.values()];
  }, [openAccess, suggestedVehicles]);

  const exitAssetOptions = useMemo(() => {
    const map = new Map<number, SuggestedAsset>();
    if (openAccess) {
      for (const asset of assetsFromAccess(openAccess, 'CHECK_IN')) {
        map.set(asset.id, asset);
      }
    }
    for (const asset of suggestedAssets) map.set(asset.id, asset);
    return [...map.values()];
  }, [openAccess, suggestedAssets]);

  function resetSelection() {
    setSelectedVehicleId(null);
    setWalkIn(true);
    setAddNewVehicle(false);
    setSelectedAssetIds([]);
    setAddNewAsset(false);
    setPlate('');
    setVehicleBrandId(null);
    setVersionId(null);
    setModel('');
    setAssetBrandId(null);
    setAssetTypeId(null);
    setAssetDescription('');
    setNotes('');
    setFormError(null);
    setFeedback(null);
    setExitVehicleId(null);
    setExitWalkIn(true);
    setExitAssetIds([]);
  }

  function prepareCheckout(access: AccessLog) {
    setExitVehicleId(access.vehicleId);
    setExitWalkIn(!access.vehicleId);
    setExitAssetIds(assetIdsFromAccess(access, 'CHECK_IN'));
  }

  async function onLookup(documentOverride?: string) {
    setLookupError(null);
    setFeedback(null);
    setFormError(null);

    const document = (documentOverride ?? identification).trim();

    if (!document) {
      setLookupError('Escribe el número de documento o escanea el carnet.');
      return;
    }

    if (documentOverride) {
      setIdentification(document);
    }

    setLookingUp(true);

    try {
      const result = await accessService.lookup(document);
      setUser(result.user);
      setOpenAccess(result.openAccess);
      setSuggestedVehicles(result.suggestedVehicles);
      setSuggestedAssets(result.suggestedAssets);
      resetSelection();
      if (result.openAccess) {
        prepareCheckout(result.openAccess);
      }
    } catch (error) {
      setUser(null);
      setOpenAccess(null);
      setSuggestedVehicles([]);
      setSuggestedAssets([]);
      setLookupError(apiMessage(error, 'No encontramos a esa persona.'));
    } finally {
      setLookingUp(false);
    }
  }

  function pickVehicle(id: number) {
    setSelectedVehicleId(id);
    setWalkIn(false);
    setAddNewVehicle(false);
  }

  function pickWalkIn() {
    setWalkIn(true);
    setSelectedVehicleId(null);
    setAddNewVehicle(false);
  }

  function pickNewVehicle() {
    setAddNewVehicle(true);
    setWalkIn(false);
    setSelectedVehicleId(null);
  }

  function toggleAsset(id: number) {
    setSelectedAssetIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function pickExitVehicle(id: number) {
    setExitVehicleId(id);
    setExitWalkIn(false);
  }

  function pickExitWalkIn() {
    setExitWalkIn(true);
    setExitVehicleId(null);
  }

  function toggleExitAsset(id: number) {
    setExitAssetIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function pickUnlistedBrand() {
    if (!unlistedBrandId) return;
    setAddNewAsset(true);
    setAssetBrandId(unlistedBrandId);
    setAssetTypeId(null);
  }

  async function onCheckOut() {
    if (!openAccess) return;

    if (!exitWalkIn && !exitVehicleId) {
      setFormError('Elige el vehículo de salida o marca que sale a pie.');
      return;
    }

    setCheckingOut(true);
    setFormError(null);

    try {
      await accessService.checkOut(openAccess.id, {
        vehicleId: exitWalkIn ? null : exitVehicleId,
        assetIds: exitAssetIds,
      });
      setFeedback('Salida registrada correctamente.');
      setOpenAccess(null);
      setUser(null);
      setSuggestedVehicles([]);
      setSuggestedAssets([]);
      setIdentification('');
      resetSelection();
    } catch (error) {
      setFormError(apiMessage(error, 'No pudimos registrar la salida.'));
    } finally {
      setCheckingOut(false);
    }
  }

  async function onCheckIn() {
    if (!user) return;

    setFormError(null);
    setFeedback(null);

    let newVehicle: {
      licensePlateNumber: string;
      brandId: number;
      versionId: number;
      model: number;
    } | null = null;

    if (addNewVehicle) {
      const plateError = validatePlate(plate);
      const yearError = validateModelYear(model);

      if (plateError || yearError || !vehicleBrandId || !versionId) {
        setFormError(plateError ?? yearError ?? 'Completa marca, versión y modelo del vehículo.');
        return;
      }

      newVehicle = {
        licensePlateNumber: normalizePlate(plate),
        brandId: vehicleBrandId,
        versionId,
        model: Number(model),
      };
    }

    if (!walkIn && !addNewVehicle && !selectedVehicleId) {
      setFormError('Elige un vehículo sugerido, uno nuevo, o marca ingreso a pie.');
      return;
    }

    const newAssets: Array<{
      description: string;
      assetsBrandId: number;
      assetsTypeId: number;
    }> = [];

    if (addNewAsset) {
      if (!assetBrandId || !assetTypeId || !assetDescription.trim()) {
        setFormError('Para el equipo nuevo elige marca, tipo y una descripción.');
        return;
      }

      newAssets.push({
        description: assetDescription.trim(),
        assetsBrandId: assetBrandId,
        assetsTypeId: assetTypeId,
      });
    }

    setSubmitting(true);

    try {
      await accessService.checkIn({
        userId: user.id,
        vehicleId: walkIn || addNewVehicle ? null : selectedVehicleId,
        newVehicle,
        assetIds: selectedAssetIds,
        newAssets,
        notes: notes.trim() || null,
      });

      setFeedback(
        `Ingreso registrado. ${
          user.email
            ? 'Se envió notificación al correo del usuario.'
            : 'El usuario no tiene correo para notificar.'
        }`,
      );
      setUser(null);
      setOpenAccess(null);
      setSuggestedVehicles([]);
      setSuggestedAssets([]);
      setIdentification('');
      resetSelection();
    } catch (error) {
      setFormError(apiMessage(error, 'No pudimos registrar el ingreso.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 18 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-semibold text-white">Registrar ingreso</Text>
        <Text className="text-sm leading-5 text-steel-400">
          Escanea el código de barras del carnet o escribe el documento. Los vehículos y equipos
          previos se sugieren para no volver a digitarlos.
        </Text>
      </View>

      {feedback ? <Banner tone="success" message={feedback} /> : null}
      {lookupError ? <Banner tone="error" message={lookupError} /> : null}
      {formError ? <Banner tone="error" message={formError} /> : null}

      <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-4">
        <TextField
          label="Número de documento"
          placeholder="Sin puntos ni espacios"
          value={identification}
          onChangeText={setIdentification}
          icon={<IdIcon />}
          keyboardType="number-pad"
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={() => void onLookup()}
        />
        <View className="gap-2">
          {Platform.OS !== 'web' ? (
            <Button
              label="Escanear carnet"
              variant="outline"
              onPress={() => setScannerOpen(true)}
            />
          ) : null}
          <Button label="Buscar persona" loading={lookingUp} onPress={() => void onLookup()} />
        </View>
        {Platform.OS === 'web' ? (
          <Text className="text-xs leading-5 text-steel-500">
            El botón de escanear carnet está disponible en el celular (Expo Go).
          </Text>
        ) : null}
      </View>

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(document) => void onLookup(document)}
      />

      {user ? (
        <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-2">
          <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
            Persona encontrada
          </Text>
          <Text className="text-lg font-medium text-white">{user.fullName}</Text>
          <Text className="text-sm text-steel-400">{roleLabel(user.role?.name)}</Text>
          <Text className="text-sm text-steel-500">
            {user.identificationType?.name ?? 'Documento'} {user.identification}
          </Text>
        </View>
      ) : null}

      {user && openAccess ? (
        <View className="rounded-card border border-ink-600 bg-ink-900 p-5 gap-4">
          <Banner
            tone="error"
            message={`Ya tiene un ingreso abierto desde las ${String(openAccess.checkInTime).slice(0, 5)}. Confirma con qué sale para cerrar el registro.`}
          />

          <View className="gap-2">
            <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
              Con qué ingresó
            </Text>
            <Text className="text-sm text-steel-200">
              Vehículo:{' '}
              {openAccess.vehicle
                ? `${vehicleTitle(openAccess.vehicle)} (${openAccess.vehicle.licensePlateNumber})`
                : 'A pie / sin vehículo'}
            </Text>
            <Text className="text-sm text-steel-200">
              Dispositivos:{' '}
              {assetsFromAccess(openAccess, 'CHECK_IN').length === 0
                ? 'Ninguno declarado'
                : assetsFromAccess(openAccess, 'CHECK_IN')
                    .map((asset) => asset.description)
                    .join(', ')}
            </Text>
          </View>

          <View className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
              Vehículo al salir
            </Text>
            <Text className="text-xs leading-5 text-steel-500">
              Marca o desmarca según lo que lleve al salir. Por defecto queda igual que al ingreso.
            </Text>

            <CheckboxRow
              label="Sale a pie / sin vehículo"
              checked={exitWalkIn}
              onToggle={pickExitWalkIn}
            />

            {exitVehicleOptions.map((vehicle) => (
              <CheckboxRow
                key={vehicle.id}
                label={vehicleTitle(vehicle)}
                hint={vehicleHint(vehicle)}
                checked={!exitWalkIn && exitVehicleId === vehicle.id}
                onToggle={() => pickExitVehicle(vehicle.id)}
              />
            ))}
          </View>

          <View className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
              Dispositivos al salir
            </Text>
            <Text className="text-xs leading-5 text-steel-500">
              Desmarca si algún equipo se queda dentro del campus.
            </Text>

            {exitAssetOptions.length === 0 ? (
              <Text className="text-sm text-steel-400">No hay dispositivos asociados.</Text>
            ) : (
              exitAssetOptions.map((asset) => (
                <CheckboxRow
                  key={asset.id}
                  label={asset.description}
                  hint={[asset.brand?.name, asset.type?.name].filter(Boolean).join(' · ')}
                  checked={exitAssetIds.includes(asset.id)}
                  onToggle={() => toggleExitAsset(asset.id)}
                />
              ))
            )}
          </View>

          <Button
            label="Registrar salida"
            loading={checkingOut}
            onPress={() => void onCheckOut()}
          />
        </View>
      ) : null}

      {user && !openAccess ? (
        <>
          <View className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
              Vehículo
            </Text>

            <CheckboxRow
              label="Ingresa a pie / sin vehículo"
              checked={walkIn && !addNewVehicle}
              onToggle={pickWalkIn}
            />

            {suggestedVehicles.map((vehicle) => (
              <CheckboxRow
                key={vehicle.id}
                label={
                  `${vehicle.brand?.name ?? ''} ${vehicle.version?.name ?? ''}`.trim() || 'Vehículo'
                }
                hint={`Placa ${vehicle.licensePlateNumber} · ${vehicle.model}`}
                checked={selectedVehicleId === vehicle.id}
                onToggle={() => pickVehicle(vehicle.id)}
              />
            ))}

            <CheckboxRow
              label="Registrar un vehículo nuevo"
              checked={addNewVehicle}
              onToggle={pickNewVehicle}
            />

            {addNewVehicle ? (
              <View className="gap-3 rounded-field border border-ink-600 bg-ink-800 p-4">
                <TextField
                  label="Placa"
                  placeholder="ABC123"
                  value={plate}
                  onChangeText={setPlate}
                  autoCapitalize="characters"
                />
                <SelectField
                  label="Marca"
                  placeholder="Elige la marca"
                  options={vehicleBrandOptions}
                  value={vehicleBrandId}
                  onChange={(value) => {
                    setVehicleBrandId(value);
                    setVersionId(null);
                  }}
                />
                <SelectField
                  label="Versión"
                  placeholder="Elige la versión"
                  options={versionOptions}
                  value={versionId}
                  onChange={setVersionId}
                />
                <TextField
                  label="Modelo (año)"
                  placeholder="2024"
                  value={model}
                  onChangeText={setModel}
                  keyboardType="number-pad"
                />
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
              Equipos / dispositivos de esta persona
            </Text>

            {suggestedAssets.length === 0 ? (
              <Text className="text-sm text-steel-500">
                Aún no tiene equipos guardados. Al registrar uno nuevo quedará asociado solo a esta
                persona.
              </Text>
            ) : (
              suggestedAssets.map((asset) => (
                <CheckboxRow
                  key={asset.id}
                  label={asset.description}
                  hint={[asset.brand?.name, asset.type?.name].filter(Boolean).join(' · ')}
                  checked={selectedAssetIds.includes(asset.id)}
                  onToggle={() => toggleAsset(asset.id)}
                />
              ))
            )}

            <CheckboxRow
              label="Registrar un equipo nuevo"
              checked={addNewAsset}
              onToggle={() => {
                setAddNewAsset((current) => !current);
                setAssetBrandId(null);
                setAssetTypeId(null);
                setAssetDescription('');
              }}
            />

            {addNewAsset ? (
              <View className="gap-3 rounded-field border border-ink-600 bg-ink-800 p-4">
                <SelectField
                  label="Marca"
                  placeholder="Ej. HP, Dell, Samsung…"
                  options={assetBrandOptions}
                  value={assetBrandId}
                  onChange={(value) => {
                    setAssetBrandId(value);
                    setAssetTypeId(null);
                  }}
                />
                <SelectField
                  label="Tipo de equipo"
                  placeholder="Portátil, celular, herramienta…"
                  options={assetTypeOptions}
                  value={assetTypeId}
                  onChange={setAssetTypeId}
                />
                <TextField
                  label="Descripción / comentario"
                  placeholder="Ej. Pavilion 15 color gris, serial parcial…"
                  value={assetDescription}
                  onChangeText={setAssetDescription}
                />
                {unlistedBrandId ? (
                  <Button
                    label="No está en el catálogo"
                    variant="outline"
                    onPress={pickUnlistedBrand}
                  />
                ) : null}
                <Text className="text-xs leading-5 text-steel-500">
                  Quedará guardado solo para esta persona. En el próximo ingreso aparecerá en las
                  sugerencias.
                </Text>
              </View>
            ) : null}
          </View>

          <TextField
            label="Notas (opcional)"
            placeholder="Observaciones del ingreso"
            value={notes}
            onChangeText={setNotes}
          />

          <Button label="Confirmar ingreso" loading={submitting} onPress={() => void onCheckIn()} />
        </>
      ) : null}
    </ScrollView>
  );
}
