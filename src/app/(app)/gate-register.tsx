import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GateOnly } from '@/components/gate-only';
import { PlateChip } from '@/components/plates/plate-chip';
import { plateCard } from '@/components/plates/styles';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  IdIcon,
  PlusIcon,
  UserIcon,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
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
import { IDENTIFICATION_TYPES } from '@/constants/identification-types';
import { roleLabel } from '@/constants/roles';
import { palette, radius } from '@/constants/theme';
import { isColombianPlate } from '@/constants/vehicle';
import { useGateAlerts } from '@/context/gate-alerts';
import { ApiError } from '@/lib/http';
import { apiMessage } from '@/lib/api-messages';
import { resolveImageUrl } from '@/lib/images';
import { clearScan, peekScan } from '@/lib/scan-store';
import { currentSurface } from '@/lib/surface';
import { relativeTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { normalizePlate } from '@/lib/validation';
import { gateService, type HolderAccount } from '@/services/gate.service';
import { vehicleService, type ScanResult, type VehicleBrand } from '@/services/vehicle.service';
import { appear, vanish, settle } from '@/lib/motion';

/** Se busca la cuenta cuando la persona deja de escribir el documento. */
const LOOKUP_DELAY_MS = 450;

const TYPE_OPTIONS = IDENTIFICATION_TYPES.map((type) => ({
  value: type.id,
  label: `${type.short} · ${type.name}`,
}));

type Holder = { identificationTypeId: number; identification: string; fullName: string };

type Lookup =
  | { phase: 'idle' }
  | { phase: 'searching' }
  | { phase: 'found'; account: HolderAccount }
  | { phase: 'none' };

/** El documento limpio con el que se busca la cuenta; vacío si todavía es muy corto. */
function lookupKey(holder: Holder): string {
  const identification = holder.identification.replace(/[^0-9A-Za-z]/g, '');
  return identification.length >= 4 ? `${holder.identificationTypeId}:${identification}` : '';
}

/**
 * Al escanear la tarjeta en el celular se pasa por la pantalla de la cámara y esta pantalla
 * se vuelve a montar. Lo que el vigilante ya escribió del propietario se guarda aquí mientras.
 */
const holderDrafts = new Map<string, Holder>();

const EMPTY_HOLDER: Holder = {
  identificationTypeId: IDENTIFICATION_TYPES[0].id,
  identification: '',
  fullName: '',
};

/** Lo que terminó: un vehículo nuevo inscrito, o una lectura asociada a uno que ya estaba. */
type Outcome = { kind: 'registered' | 'linked'; plate: string; owner: string };

export default function GateRegisterRoute() {
  return (
    <GateOnly>
      <GateRegisterScreen />
    </GateOnly>
  );
}

function GateRegisterScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ alertId?: string; plate?: string }>();
  const alertId = params.alertId ? Number(params.alertId) : undefined;
  const readPlate = params.plate ? normalizePlate(params.plate) : '';
  const draftKey = `${alertId ?? ''}-${readPlate}`;

  const { pending, refresh } = useGateAlerts();
  const alert = pending.find((item) => item.id === alertId);

  // Al volver de la cámara (celular) la tarjeta ya leída llena el formulario.
  const [returned] = useState(() => peekScan('gate'));
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [draft, setDraft] = useState<Draft | null>(() =>
    returned ? draftFromProposal(returned.proposal) : null,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [review, setReview] = useState<Set<string>>(() => new Set(returned?.review ?? []));
  const [plateTaken, setPlateTaken] = useState(Boolean(returned?.plateTaken));
  const [linking, setLinking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [holder, setHolder] = useState<Holder>(() => holderDrafts.get(draftKey) ?? EMPTY_HOLDER);
  const [holderErrors, setHolderErrors] = useState<{
    identification?: string | null;
    fullName?: string | null;
  }>({});
  const [found, setFound] = useState<{ key: string; account: HolderAccount | null } | null>(null);
  const now = useNow();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Outcome | null>(null);

  useEffect(() => {
    clearScan('gate');
    vehicleService
      .brands()
      .then(setBrands)
      .catch(() =>
        setFeedback('No pudimos cargar el catálogo de marcas. Puedes escribirlas a mano.'),
      );
  }, []);

  useEffect(() => {
    holderDrafts.set(draftKey, holder);
  }, [draftKey, holder]);

  const applyScan = useCallback((result: ScanResult) => {
    if (!result.readable) {
      setFeedback(UNREADABLE_CARD);
      return;
    }
    setDraft(draftFromProposal(result.proposal));
    setReview(new Set(result.review));
    setPlateTaken(result.plateTaken);
    setErrors({});
    setFeedback(null);
  }, []);

  // ¿El documento tiene cuenta en ENTRYX? Entonces el vehículo también queda en su cuenta.
  const key = lookupKey(holder);
  const lookup: Lookup = !key
    ? { phase: 'idle' }
    : found?.key !== key
      ? { phase: 'searching' }
      : found.account
        ? { phase: 'found', account: found.account }
        : { phase: 'none' };

  useEffect(() => {
    if (!key) return;

    let alive = true;
    const [typeId, identification] = key.split(':');
    const timer = setTimeout(() => {
      gateService
        .findPerson(Number(typeId), identification)
        .then((account) => {
          if (!alive) return;
          setFound({ key, account });
          if (account) {
            setHolder((current) =>
              current.fullName.trim() ? current : { ...current, fullName: account.fullName },
            );
          }
        })
        .catch(() => alive && setFound({ key, account: null }));
    }, LOOKUP_DELAY_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key]);

  async function scanCard() {
    if (currentSurface === 'mobile') {
      // La cámara vuelve aquí mismo (con la alerta y lo ya escrito) y deja la tarjeta leída.
      router.push({ pathname: '/scan-card', params: { returnTo: 'gate' } });
      return;
    }

    setFeedback(null);
    setScanning(true);
    try {
      const result = await scanCardFromLibrary();
      if (result) applyScan(result);
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setScanning(false);
    }
  }

  function fillByHand() {
    // La placa que leyó la cámara sirve de punto de partida si tiene formato colombiano.
    setDraft({ ...EMPTY_DRAFT, plate: isColombianPlate(readPlate) ? readPlate : '' });
    setReview(new Set());
    setPlateTaken(false);
    setFeedback(null);
  }

  function updateDraft(changes: Partial<Draft>, reviewed: string[]) {
    setDraft((current) => (current ? { ...current, ...changes } : current));
    setReview((current) => {
      const next = new Set(current);
      reviewed.forEach((name) => next.delete(name));
      return next;
    });
    if ('plate' in changes) setPlateTaken(false);
  }

  async function onSubmit() {
    if (!draft) return;

    const vehicleErrors = validateDraft(draft);
    const ownerErrors = {
      identification:
        holder.identification.replace(/[^0-9A-Za-z]/g, '').length >= 4
          ? null
          : 'Escribe el número de documento.',
      fullName:
        holder.fullName.trim().length >= 3 ? null : 'Escribe el nombre completo del propietario.',
    };

    setErrors(vehicleErrors);
    setHolderErrors(ownerErrors);
    setFeedback(null);

    if (hasErrors(vehicleErrors) || ownerErrors.identification || ownerErrors.fullName) return;

    setSaving(true);
    try {
      const input = inputFromDraft(draft);
      await gateService.registerVehicle(
        input,
        {
          identificationTypeId: holder.identificationTypeId,
          identification: holder.identification,
          fullName: holder.fullName.trim(),
        },
        alertId,
      );
      holderDrafts.delete(draftKey);
      await refresh();
      setDone({
        kind: 'registered',
        plate: input.licensePlateNumber,
        owner: lookup.phase === 'found' ? lookup.account.fullName : holder.fullName.trim(),
      });
    } catch (error) {
      if (error instanceof ApiError && error.message === 'License plate already registered') {
        // No es un error del vigilante: el vehículo ya existe. La tarjeta lo explica arriba.
        setPlateTaken(true);
      } else {
        setFeedback(apiMessage(error, 'No pudimos inscribir el vehículo.'));
      }
    } finally {
      setSaving(false);
    }
  }

  /** La tarjeta es de un vehículo ya inscrito: se asocia la lectura y se cierra la alerta. */
  async function linkToExisting() {
    if (!draft) return;
    const plate = normalizePlate(draft.plate);

    setLinking(true);
    setFeedback(null);
    try {
      await gateService.linkVehicle(plate, readPlate, alertId);
      holderDrafts.delete(draftKey);
      await refresh();
      setDone({ kind: 'linked', plate, owner: '' });
    } catch (error) {
      setFeedback(apiMessage(error, 'No pudimos asociar la lectura al vehículo.'));
    } finally {
      setLinking(false);
    }
  }

  if (done) {
    return <Registered outcome={done} cameraPlate={readPlate} />;
  }

  const cardPlate = draft ? normalizePlate(draft.plate) : '';
  const plateMismatch = Boolean(readPlate && cardPlate.length >= 5 && cardPlate !== readPlate);
  const image = resolveImageUrl(alert?.imagePath);

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Animated.View entering={appear} style={{ gap: 10 }}>
        <PressableScale
          accessibilityLabel="Volver"
          depth={0.95}
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/alerts'))}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
          }}
        >
          <ArrowLeftIcon size={18} color={palette.accent400} />
          <Text className="text-sm font-medium text-accent-400">Volver</Text>
        </PressableScale>
        <Text className="text-3xl font-bold tracking-tight text-steel-100">Inscribir vehículo</Text>
        <Text className="text-sm leading-5 text-steel-300">
          Pide la tarjeta de propiedad y escanéala: los datos del vehículo se llenan solos. El
          propietario lo escribes tú, tal como aparece en su documento.
        </Text>
      </Animated.View>

      {readPlate ? (
        <View
          style={[plateCard, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }]}
        >
          <View style={{ gap: 8 }}>
            <PlateChip plate={readPlate} colombian={isColombianPlate(readPlate)} />
            {image ? (
              <Image
                source={{ uri: image }}
                contentFit="contain"
                style={{ height: 36, width: 96, borderRadius: 6, backgroundColor: palette.ink950 }}
              />
            ) : null}
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-steel-100">Placa leída por la cámara</Text>
            <Text className="text-sm text-steel-300" numberOfLines={2}>
              {alert
                ? `${alert.cameraName} · ${relativeTime(new Date(alert.lastSeenAt).getTime(), now)}`
                : 'Del historial de entradas y salidas'}
            </Text>
          </View>
        </View>
      ) : null}

      {feedback ? <Banner tone="error" message={feedback} /> : null}

      <Section title="Vehículo">
        {draft === null ? (
          <Animated.View entering={appear} layout={settle} style={{ gap: 12 }}>
            <ScanCardButton scanning={scanning} onPress={() => void scanCard()} />
            <PressableScale
              accessibilityLabel="Llenar los datos a mano"
              disabled={scanning}
              onPress={fillByHand}
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
                backgroundColor: palette.ink900,
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
            layout={settle}
            style={[plateCard, { gap: 20, padding: 20 }]}
          >
            {review.size > 0 ? (
              <Text className="text-sm leading-5 text-steel-300">
                Revisa los datos marcados en amarillo contra la tarjeta: pueden estar mal leídos.
              </Text>
            ) : null}
            {plateTaken ? (
              <AlreadyRegistered
                plate={cardPlate}
                cameraPlate={readPlate}
                linking={linking}
                onLink={() => void linkToExisting()}
              />
            ) : null}
            {plateMismatch && !plateTaken ? (
              <Banner
                tone="info"
                message={`La tarjeta dice ${cardPlate} y la cámara leyó ${readPlate}. Se inscribe la placa de la tarjeta, y cuando la cámara vuelva a leer ${readPlate} lo reconocerá como este vehículo.`}
              />
            ) : null}
            <VehicleFields
              draft={draft}
              errors={errors}
              review={review}
              brands={brands}
              onChange={updateDraft}
            />
            <PressableScale
              accessibilityLabel="Escanear otra tarjeta"
              depth={0.96}
              disabled={scanning}
              onPress={() => void scanCard()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                alignSelf: 'flex-start',
                paddingVertical: 6,
              }}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={palette.accent400} />
              ) : (
                <CameraIcon size={17} color={palette.accent400} />
              )}
              <Text className="text-sm font-medium text-accent-400">
                {scanning ? 'Leyendo tarjeta…' : 'Escanear la tarjeta de nuevo'}
              </Text>
            </PressableScale>
          </Animated.View>
        )}
      </Section>

      <Section title="Propietario">
        <View style={[plateCard, { gap: 20, padding: 20 }]}>
          <SelectField
            label="Tipo de documento"
            placeholder="Elige el tipo"
            options={TYPE_OPTIONS}
            value={holder.identificationTypeId}
            searchable={false}
            icon={<IdIcon />}
            onChange={(value) =>
              setHolder((current) => ({ ...current, identificationTypeId: value }))
            }
          />
          <View style={{ gap: 8 }}>
            <TextField
              label="Número de documento"
              value={holder.identification}
              onChangeText={(value) => {
                setHolder((current) => ({ ...current, identification: value }));
                setHolderErrors((current) => ({ ...current, identification: null }));
              }}
              error={holderErrors.identification}
              icon={<IdIcon />}
              placeholder="Sin puntos ni espacios"
              keyboardType="number-pad"
              inputMode="numeric"
              autoCorrect={false}
              maxLength={20}
            />
            <AccountStatus lookup={lookup} />
          </View>
          <TextField
            label="Nombre completo"
            value={holder.fullName}
            onChangeText={(value) => {
              setHolder((current) => ({ ...current, fullName: value }));
              setHolderErrors((current) => ({ ...current, fullName: null }));
            }}
            error={holderErrors.fullName}
            icon={<UserIcon />}
            placeholder="Como aparece en el documento"
            autoCapitalize="words"
            maxLength={100}
          />
        </View>
      </Section>

      <View style={{ gap: 12 }}>
        <Button
          label="Inscribir vehículo"
          loading={saving}
          disabled={!draft || plateTaken}
          onPress={() => void onSubmit()}
        />
        {!draft ? (
          <Text className="text-center text-xs text-steel-400">
            Primero escanea la tarjeta o llena el vehículo a mano.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Animated.View layout={settle} style={{ gap: 12 }}>
      <Text className="text-lg font-semibold text-steel-100">{title}</Text>
      {children}
    </Animated.View>
  );
}

function AccountStatus({ lookup }: { lookup: Lookup }) {
  if (lookup.phase === 'idle') return null;

  if (lookup.phase === 'searching') {
    return (
      <View className="flex-row items-center gap-2">
        <ActivityIndicator size="small" color={palette.steel400} />
        <Text className="text-xs text-steel-300">Buscando si tiene cuenta en ENTRYX…</Text>
      </View>
    );
  }

  if (lookup.phase === 'none') {
    return (
      <Animated.Text entering={appear} className="text-xs leading-4 text-steel-300">
        No tiene cuenta en ENTRYX: el vehículo queda a nombre de lo que escribas aquí.
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      entering={appear}
      exiting={vanish}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: radius.field,
        borderCurve: 'continuous',
        backgroundColor: 'rgba(52, 211, 153, 0.10)',
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <CheckIcon size={16} color={palette.success} />
      <Text className="flex-1 text-xs leading-4 text-state-success">
        Tiene cuenta: {lookup.account.fullName} ({roleLabel(lookup.account.role?.name)}). El
        vehículo también aparecerá en sus vehículos.
      </Text>
    </Animated.View>
  );
}

/**
 * La placa de la tarjeta ya tiene vehículo en ENTRYX. Casi siempre es la cámara que leyó mal la
 * placa (o una alerta de antes de inscribirlo): se ofrece asociar la lectura a ese vehículo.
 */
function AlreadyRegistered({
  plate,
  cameraPlate,
  linking,
  onLink,
}: {
  plate: string;
  cameraPlate: string;
  linking: boolean;
  onLink: () => void;
}) {
  const misread = Boolean(cameraPlate && cameraPlate !== plate);

  return (
    <Animated.View
      entering={appear}
      style={{
        gap: 12,
        borderRadius: radius.field,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: 'rgba(61, 143, 245, 0.38)',
        backgroundColor: 'rgba(61, 143, 245, 0.10)',
        padding: 14,
      }}
    >
      <Text className="text-sm font-semibold text-steel-100">
        {plate} ya está inscrito en ENTRYX
      </Text>
      <Text className="text-sm leading-5 text-steel-300">
        {misread
          ? `La cámara lo leyó como ${cameraPlate}. Si es el mismo vehículo, asocia esa lectura: la alerta se cierra y no vuelve a alertar por él.`
          : 'La alerta es de antes de que lo inscribieran. Ciérrala asociándola a ese vehículo.'}
      </Text>
      <Button
        label={misread ? 'Es el mismo vehículo: asociar la lectura' : 'Cerrar la alerta'}
        loading={linking}
        onPress={onLink}
      />
    </Animated.View>
  );
}

function Registered({ outcome, cameraPlate }: { outcome: Outcome; cameraPlate: string }) {
  const insets = useSafeAreaInsets();
  const { plate, owner } = outcome;
  const linked = outcome.kind === 'linked';

  return (
    <View className="flex-1 justify-center gap-6 p-6" style={{ paddingBottom: insets.bottom + 24 }}>
      <Animated.View
        entering={appear}
        style={{
          height: 72,
          width: 72,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          borderRadius: radius.pill,
          backgroundColor: 'rgba(52, 211, 153, 0.16)',
        }}
      >
        <CheckIcon size={36} color={palette.success} />
      </Animated.View>
      <Animated.View entering={appear} style={{ alignItems: 'center', gap: 10 }}>
        <Text className="text-2xl font-bold tracking-tight text-steel-100">
          {linked ? 'Lectura asociada' : 'Vehículo inscrito'}
        </Text>
        <PlateChip plate={plate} colombian={isColombianPlate(plate)} />
        <Text className="text-center text-sm leading-5 text-steel-300">
          {linked
            ? cameraPlate && cameraPlate !== plate
              ? `Cuando la cámara lea ${cameraPlate}, lo reconocerá como este vehículo. La alerta quedó cerrada.`
              : 'La alerta quedó cerrada: el vehículo ya estaba inscrito.'
            : `Quedó a nombre de ${owner}. Desde ya entra y sale sin alertas.`}
        </Text>
      </Animated.View>
      <Animated.View entering={appear} style={{ gap: 10 }}>
        <Button label="Volver a las cámaras" onPress={() => router.navigate('/monitor')} />
        <Button label="Ver alertas" variant="outline" onPress={() => router.navigate('/alerts')} />
      </Animated.View>
    </View>
  );
}
