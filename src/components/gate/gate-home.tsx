import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { PlateChip } from '@/components/plates/plate-chip';
import { ReadRow } from '@/components/plates/read-row';
import { plateCard, tabular } from '@/components/plates/styles';
import { usePlateFeed } from '@/components/plates/use-plate-feed';
import {
  AlertIcon,
  CarIcon,
  ChevronRightIcon,
  ScanIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { HomeHero } from '@/components/app/home-hero';
import { ResolvedRow } from '@/components/gate/alert-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { RoleName } from '@/constants/roles';
import { palette, radius } from '@/constants/theme';
import { isColombianPlate } from '@/constants/vehicle';
import { useGateAlerts } from '@/context/gate-alerts';
import { useSession } from '@/context/session';
import { PERMANENT_MENU_BREAKPOINT, useContentWidth, WIDE_CONTENT_WIDTH } from '@/lib/layout';
import { relativeTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { gateService, type GateCamera } from '@/services/gate.service';
import { ActivityList, useGateActivity } from './activity-list';

/** El estado de las cámaras cambia lento; en Inicio basta con revisarlo cada tanto. */
const CAMERAS_POLL_MS = 10000;
/** Desde este ancho de contenido, Inicio va en dos columnas y la cabecera crece. */
const TWO_COLUMN_MIN = 860;

/**
 * Inicio de Portería: lo que hay que mirar al llegar al turno. Si hay vehículos esperando, eso va
 * antes que todo; después la cabecera con la hora, el resumen del día, los últimos pasos, las
 * cámaras y lo que cambió.
 */
export function GateHome({ firstName }: { firstName: string }) {
  const now = useNow();
  const wide = useContentWidth(WIDE_CONTENT_WIDTH) >= TWO_COLUMN_MIN;
  const feed = usePlateFeed();
  const activity = useGateActivity();
  const cameras = useCameraStatus();
  const { pending } = useGateAlerts();
  // Con el menú lateral fijo todos los destinos ya están a la vista: no se repiten aquí.
  const sideMenu = useWindowDimensions().width >= PERMANENT_MENU_BREAKPOINT;

  const hero = (
    <HomeHero firstName={firstName} wide={wide}>
      {pending.length === 0 ? <AllClear /> : null}
    </HomeHero>
  );

  // En el PC es la última tarjeta de su columna: se estira para cerrar al mismo nivel que la otra.
  const recent = (
    <View style={[plateCard, { gap: 4, padding: 16 }, wide ? { flexGrow: 1 } : null]}>
      <SectionLink title="Últimos pasos" label="Ver todo" href="/access-log" />
      {feed.reads.length === 0 ? (
        <Text className="py-1 text-sm text-steel-400">
          {feed.status === 'live' ? 'Aún no pasa ningún vehículo.' : 'Conectando…'}
        </Text>
      ) : (
        feed.reads.slice(0, wide ? 8 : 5).map((read) => <ReadRow key={read.id} read={read} />)
      )}
    </View>
  );

  if (!wide) {
    return (
      <View style={{ gap: 16 }}>
        <PendingCallout />
        {hero}
        <Today feed={feed} />
        {recent}
        <CamerasCard cameras={cameras} now={now} />
        <ActivityList activity={activity} now={now} limit={5} />
        {sideMenu ? null : <Shortcuts />}
      </View>
    );
  }

  return (
    <View style={{ gap: 20 }}>
      <PendingCallout />
      {hero}
      {/* Las dos columnas miden lo mismo y su última tarjeta se estira: terminan alineadas abajo.
          Cámaras va al final de la derecha porque es la única que siempre está. */}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 20 }}>
        <View style={{ flex: 3, gap: 20 }}>
          <Today feed={feed} />
          {recent}
        </View>
        <View style={{ flex: 2, gap: 20 }}>
          <ResolvedToday />
          <ActivityList activity={activity} now={now} limit={5} />
          {sideMenu ? null : <Shortcuts />}
          <CamerasCard cameras={cameras} now={now} grow />
        </View>
      </View>
    </View>
  );
}

function useCameraStatus(): GateCamera[] | null {
  const [cameras, setCameras] = useState<GateCamera[] | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const next = await gateService.cameras();
        if (alive) setCameras(next);
      } catch {
        // Servicio de visión apagado: se muestra como "sin datos" en la tarjeta.
        if (alive) setCameras([]);
      }
      if (alive) timer = setTimeout(() => void tick(), CAMERAS_POLL_MS);
    }

    void tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return cameras;
}

/** En el PC, lo que portería ya resolvió en el turno: inscritos y visitas, con quién y cuándo. */
function ResolvedToday() {
  const { resolvedToday } = useGateAlerts();

  return (
    <View style={[plateCard, { gap: 4, padding: 16 }]}>
      <SectionLink title="Resueltas hoy" label="Alertas" href="/alerts" />
      {resolvedToday.length === 0 ? (
        <Text className="py-1 text-sm text-steel-400">Todavía no se ha resuelto ninguna.</Text>
      ) : (
        resolvedToday.slice(0, 5).map((alert, index) => (
          <View
            key={alert.id}
            style={index > 0 ? { borderTopWidth: 1, borderTopColor: palette.hairline } : undefined}
          >
            <ResolvedRow alert={alert} />
          </View>
        ))
      )}
    </View>
  );
}

/** Turno sin pendientes: una línea dentro de la cabecera, sin caja propia. */
function AllClear() {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <ShieldIcon size={16} color={palette.success} />
      <Text className="text-sm text-steel-200">
        <Text className="font-semibold text-state-success">Todo en orden</Text>
        {'  ·  '}Nadie esperando
      </Text>
    </View>
  );
}

/** Lo urgente primero: vehículos sin registrar esperando. Sin pendientes no se muestra. */
function PendingCallout() {
  const { pending } = useGateAlerts();
  const count = pending.length;

  // Sin pendientes no hay caja: la cabecera lo dice en una línea (`AllClear`).
  if (count === 0) return null;

  const latest = pending[0];

  return (
    <PressableScale
      accessibilityLabel={`${count} vehículos sin registrar. Resolver`}
      depth={0.98}
      onPress={() => router.navigate('/alerts')}
      style={[
        plateCard,
        { gap: 12, padding: 16 },
        { borderColor: 'rgba(251, 113, 133, 0.5)', backgroundColor: 'rgba(251, 113, 133, 0.08)' },
      ]}
    >
      <View className="flex-row items-center gap-3">
        <AlertIcon size={22} color={palette.danger} />
        <Text className="flex-1 text-base font-semibold text-state-danger">
          {count === 1 ? '1 vehículo sin registrar' : `${count} vehículos sin registrar`}
        </Text>
        <ChevronRightIcon size={18} color={palette.steel300} />
      </View>
      <View className="flex-row items-center gap-3">
        <PlateChip
          plate={latest.licensePlateNumber}
          colombian={isColombianPlate(latest.licensePlateNumber)}
        />
        <Text className="flex-1 text-sm text-steel-300" numberOfLines={2}>
          El último entró por {latest.cameraName}. Inscríbelos con la tarjeta de propiedad o déjalos
          pasar como visita.
        </Text>
      </View>
    </PressableScale>
  );
}

function Today({ feed }: { feed: ReturnType<typeof usePlateFeed> }) {
  const items = [
    { label: 'Adentro ahora', value: feed.summary?.inside },
    { label: 'Entradas hoy', value: feed.summary?.entriesToday },
    { label: 'Sin registrar hoy', value: feed.summary?.unregisteredToday, notice: true },
  ];

  // Es un conteo, no algo por resolver: el rojo queda solo para las alertas pendientes.
  return (
    <View style={[plateCard, { flexDirection: 'row', gap: 8, padding: 16 }]}>
      {items.map((item) => {
        const noticed = item.notice && (item.value ?? 0) > 0;
        return (
          <View key={item.label} style={{ flex: 1, gap: 2 }}>
            <Text
              style={[
                tabular,
                {
                  fontFamily: 'Michroma_400Regular',
                  fontSize: 24,
                  lineHeight: 34,
                  color: noticed ? palette.warning : palette.steel100,
                },
              ]}
            >
              {item.value ?? '–'}
            </Text>
            <Text className="text-xs text-steel-300" numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const STATUS_LABEL: Record<GateCamera['status'], { text: string; color: string }> = {
  live: { text: 'En vivo', color: palette.success },
  connecting: { text: 'Conectando', color: palette.warning },
  offline: { text: 'Sin señal', color: palette.danger },
  ended: { text: 'Video terminado', color: palette.steel500 },
  removed: { text: 'Quitada', color: palette.steel600 },
};

function CamerasCard({
  cameras,
  now,
  grow = false,
}: {
  cameras: GateCamera[] | null;
  now: number;
  /** Última tarjeta de su columna en el PC: se estira hasta el borde inferior de la otra. */
  grow?: boolean;
}) {
  const active = cameras?.filter((camera) => camera.status !== 'removed') ?? [];
  const live = active.filter((camera) => camera.status === 'live').length;

  return (
    <View style={[plateCard, { gap: 4, padding: 16 }, grow ? { flexGrow: 1 } : null]}>
      <SectionLink title="Cámaras" label="Ver en vivo" href="/monitor" />
      <Text className="pb-1 text-sm text-steel-300">
        {cameras === null
          ? 'Revisando…'
          : cameras.length === 0
            ? 'Sin cámaras fijas o el servicio de visión está apagado.'
            : `${live} de ${active.length} transmitiendo`}
      </Text>
      {(cameras ?? []).map((camera) => {
        const status = STATUS_LABEL[camera.status];
        return (
          <View
            key={camera.id}
            className="flex-row items-center gap-3"
            style={{ paddingVertical: 7 }}
          >
            <View
              style={{
                height: 8,
                width: 8,
                borderRadius: radius.pill,
                backgroundColor: status.color,
              }}
            />
            <View className="flex-1">
              <Text
                className="text-sm text-steel-100"
                style={camera.status === 'removed' ? { color: palette.steel500 } : null}
                numberOfLines={1}
              >
                {camera.name}
              </Text>
              <Text className="text-xs text-steel-400" numberOfLines={1}>
                {status.text}
                {camera.status === 'removed'
                  ? camera.removedBy
                    ? ` por ${camera.removedBy}`
                    : ''
                  : ` · ${camera.direction === 'ENTRY' ? 'Entrada' : camera.direction === 'EXIT' ? 'Salida' : 'Automático'}`}
                {camera.lastPlate && camera.status !== 'removed'
                  ? ` · última ${relativeTime(new Date(camera.lastPlate.at).getTime(), now)}`
                  : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Solo en el celular, y solo lo que no está en las pestañas de abajo. */
function Shortcuts() {
  const { user } = useSession();
  const items: { label: string; icon: typeof ScanIcon; href: Href }[] = [
    { label: 'Detección manual', icon: ScanIcon, href: '/detection' },
    { label: 'Mis vehículos', icon: CarIcon, href: '/vehicles' },
    // Administración no tiene pestaña propia: llega a Usuarios desde aquí.
    ...(user?.role?.name === RoleName.ADMINISTRATIVE_STAFF
      ? [{ label: 'Usuarios', icon: UsersIcon, href: '/users' as Href }]
      : []),
  ];

  return (
    <View style={[plateCard, { paddingHorizontal: 16, paddingVertical: 4 }]}>
      {items.map(({ label, icon: Icon, href }, index) => (
        <PressableScale
          key={label}
          accessibilityLabel={label}
          depth={0.98}
          onPress={() => router.navigate(href)}
          style={{
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            ...(index > 0 ? { borderTopWidth: 1, borderTopColor: palette.hairline } : null),
          }}
        >
          <Icon size={19} color={palette.accent400} />
          <Text className="flex-1 text-[15px] text-steel-100" numberOfLines={1}>
            {label}
          </Text>
          <ChevronRightIcon size={16} color={palette.steel500} />
        </PressableScale>
      ))}
    </View>
  );
}

function SectionLink({ title, label, href }: { title: string; label: string; href: Href }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base font-semibold text-steel-100">{title}</Text>
      <PressableScale
        accessibilityLabel={label}
        depth={0.95}
        onPress={() => router.navigate(href)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 }}
      >
        <Text className="text-sm text-accent-400">{label}</Text>
        <ChevronRightIcon size={15} color={palette.accent400} />
      </PressableScale>
    </View>
  );
}
