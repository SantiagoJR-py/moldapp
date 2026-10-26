import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeviceCamera } from '@/components/gate/device-camera';
import type { DeviceCameraHandle } from '@/components/gate/device-camera.types';
import { DropZone } from '@/components/plates/drop-zone';
import { LiveStatus } from '@/components/plates/live-status';
import { PlateChip } from '@/components/plates/plate-chip';
import { ReadCard } from '@/components/plates/read-card';
import { ReadRow } from '@/components/plates/read-row';
import { plateCard, tabular } from '@/components/plates/styles';
import { usePlateFeed } from '@/components/plates/use-plate-feed';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { AlertIcon, ArrowLeftIcon, InfoIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Segmented } from '@/components/ui/segmented';
import { GateOnly } from '@/components/gate-only';
import { palette, radius } from '@/constants/theme';
import { useGateAlerts } from '@/context/gate-alerts';
import { useSession } from '@/context/session';
import { apiMessage } from '@/lib/api-messages';
import { useContentWidth } from '@/lib/layout';
import { useNow } from '@/lib/use-now';
import { MB, type PickedFile } from '@/lib/picked-file';
import { currentSurface } from '@/lib/surface';
import { plateDetectionService, type Detection } from '@/services/plate-detection.service';
import { gateService, type PlateBox } from '@/services/gate.service';
import type { PlateRead } from '@/services/plate-read.service';
import { appear, settle } from '@/lib/motion';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Windows reporta los AVI como `video/avi`; otros sistemas, como `video/x-msvideo`. */
const VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
  'video/msvideo',
];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi'];
const ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES, ...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join(',');
const MAX_IMAGE_BYTES = 10 * MB;
const MAX_VIDEO_BYTES = 300 * MB;
const HINT = 'Fotos JPG, PNG o WEBP hasta 10 MB · Videos MP4, MOV o AVI hasta 300 MB';
/** El servicio analiza unos 5 cuadros por segundo de video: consultar más seguido no aporta. */
const JOB_POLL_MS = 1500;
/** Una foto por segundo: alcanza para juntar dos lecturas del carro mientras pasa la barrera. */
const FRAME_INTERVAL_MS = 1000;
/** Si el servicio falla, se espera un poco antes de volver a intentar. */
const RETRY_MS = 2500;
const TWO_COLUMN_MIN = 760;
const LIVE_ITEMS = 8;

type Mode = 'camera' | 'file';

type Kind = 'image' | 'video';

type Analysis =
  | { phase: 'idle' }
  | { phase: 'working'; file: PickedFile; kind: Kind; progress: number; detections: Detection[] }
  | { phase: 'done'; file: PickedFile; kind: Kind; detections: Detection[] }
  | { phase: 'error'; message: string };

/** Si el tipo viene vacío o genérico, decide la extensión (igual que el backend). */
function kindOf(file: PickedFile): Kind | null {
  if (IMAGE_TYPES.includes(file.mimeType)) return 'image';
  if (VIDEO_TYPES.includes(file.mimeType)) return 'video';
  if (file.mimeType && file.mimeType !== 'application/octet-stream') return null;

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
  return null;
}

function validate(file: PickedFile): { kind: Kind } | { error: string } {
  const kind = kindOf(file);
  if (kind === 'image') {
    return file.size > MAX_IMAGE_BYTES ? { error: 'La foto debe pesar 10 MB o menos.' } : { kind };
  }
  if (kind === 'video') {
    return file.size > MAX_VIDEO_BYTES
      ? { error: 'El video debe pesar 300 MB o menos.' }
      : { kind };
  }
  return {
    error:
      'Ese tipo de archivo no se puede analizar. Usa JPG, PNG o WEBP, o un video MP4, MOV o AVI.',
  };
}

/** Cada vez que se abre la cámara es una sesión nueva en el servicio de visión. */
function newSession(): string {
  return `equipo-${Math.random().toString(36).slice(2, 10)}`;
}

function openRegistration(read: PlateRead) {
  router.push({
    pathname: '/gate-register',
    params: {
      plate: read.licensePlateNumber,
      ...(read.alert?.status === 'PENDING' ? { alertId: String(read.alert.id) } : {}),
    },
  });
}

export default function DetectionRoute() {
  return (
    <GateOnly>
      <DetectionScreen />
    </GateOnly>
  );
}

function DetectionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const wide = useContentWidth() >= TWO_COLUMN_MIN;
  const feed = usePlateFeed();
  const [mode, setMode] = useState<Mode>(params.mode === 'file' ? 'file' : 'camera');

  const live = (
    <View style={wide ? { width: 280, gap: 12 } : { gap: 12 }}>
      <View style={[plateCard, { gap: 14, padding: 16 }]}>
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-steel-200">Historial en vivo</Text>
          <LiveStatus status={feed.status} />
        </View>
        {feed.summary ? (
          <View className="flex-row" style={{ columnGap: 16 }}>
            <Figure value={feed.summary.inside} label="Adentro" />
            <Figure value={feed.summary.entriesToday} label="Entradas hoy" />
            <Figure value={feed.summary.pendingAlerts} label="Por resolver" alert />
          </View>
        ) : null}
        {feed.reads.length === 0 && feed.status === 'live' ? (
          <Text className="text-sm leading-5 text-steel-400">
            Lo que detectes aparecerá aquí y en entradas y salidas.
          </Text>
        ) : (
          <View style={{ gap: 2 }}>
            {feed.reads.slice(0, LIVE_ITEMS).map((read) => (
              <Animated.View key={read.id} entering={appear} layout={settle}>
                <ReadRow read={read} />
              </Animated.View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const workspace = (
    <View style={{ flex: 1, gap: 16 }}>
      <Segmented
        accessibilityLabel="Cómo detectar"
        value={mode}
        onChange={setMode}
        segments={[
          { value: 'camera', label: 'Cámara de este equipo' },
          { value: 'file', label: 'Subir archivo' },
        ]}
      />
      {mode === 'camera' ? <CameraMode /> : <FileMode now={feed.now} />}
    </View>
  );

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Animated.View entering={appear} style={{ gap: 8 }}>
        <PressableScale
          accessibilityLabel="Volver a las cámaras"
          depth={0.95}
          onPress={() => router.navigate('/monitor')}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
          }}
        >
          <ArrowLeftIcon size={18} color={palette.accent400} />
          <Text className="text-sm font-medium text-accent-400">En vivo</Text>
        </PressableScale>
        <Text className="text-3xl font-bold tracking-tight text-steel-100">Detección manual</Text>
        <Text className="text-sm leading-5 text-steel-300">
          {mode === 'camera'
            ? 'Apunta la cámara a la placa del vehículo que llega. Cuando termina de pasar se registra la entrada y, si no está inscrito, suena la alerta.'
            : 'Sube una foto o un video: lo que se detecte se guarda en entradas y salidas como prueba.'}
        </Text>
      </Animated.View>

      {feed.error && feed.status === 'forbidden' ? (
        <Banner tone="error" message={feed.error} />
      ) : null}

      {wide ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20 }}>
          {workspace}
          {live}
        </View>
      ) : (
        <>
          {workspace}
          {live}
        </>
      )}
    </ScrollView>
  );
}

/**
 * La cámara del celular o del PC como lector de placas: manda una foto por segundo y el
 * servicio junta las del mismo carro, igual que con una cámara fija.
 */
function CameraMode() {
  const { user } = useSession();
  const { pendingPlates } = useGateAlerts();
  const camera = useRef<DeviceCameraHandle>(null);
  const [session] = useState(newSession);
  const mounted = useRef(true);
  const [running, setRunning] = useState(false);
  const [boxes, setBoxes] = useState<PlateBox[]>([]);
  const [found, setFound] = useState<Detection[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const now = useNow();

  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? 'portería';
  const cameraName =
    currentSurface === 'mobile' ? `Celular de ${firstName}` : 'Cámara del PC de portería';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    let alive = true;

    async function loop() {
      while (alive) {
        const started = Date.now();
        try {
          const frame = await camera.current?.capture();
          if (frame && alive) {
            const result = await gateService.liveFrame(frame, session, cameraName);
            if (!alive) break;
            setBoxes(result.boxes);
            if (result.detections.length) setFound((current) => [...result.detections, ...current]);
            setProblem(null);
          }
        } catch (error) {
          if (!alive) break;
          setBoxes([]);
          setProblem(apiMessage(error, 'No pudimos analizar la foto de la cámara.'));
          await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, FRAME_INTERVAL_MS - (Date.now() - started))),
        );
      }
    }

    void loop();

    return () => {
      alive = false;
      setBoxes([]);
      // Lo que quedó a medio leer (el carro seguía frente a la cámara) se registra al pausar.
      gateService
        .liveClose(session)
        .then((closed) => {
          if (mounted.current && closed.length) setFound((current) => [...closed, ...current]);
        })
        .catch(() => {});
    };
  }, [running, session, cameraName]);

  return (
    <View style={{ gap: 16 }}>
      <DeviceCamera ref={camera} boxes={running ? boxes : []} alerted={pendingPlates} />

      <View className="flex-row items-center gap-2.5">
        <ReadingDot running={running} />
        <Text className="flex-1 text-sm text-steel-300">
          {running ? `Leyendo placas como "${cameraName}"` : 'En pausa: no se envía ninguna foto'}
        </Text>
      </View>

      {problem ? <Banner tone="error" message={problem} /> : null}

      {running ? (
        <Button label="Pausar" variant="outline" onPress={() => setRunning(false)} />
      ) : (
        <Button label="Empezar a leer placas" onPress={() => setRunning(true)} />
      )}

      {found.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text className="text-lg font-semibold text-steel-100">Leídas con esta cámara</Text>
          {found.map((detection, index) => (
            <Animated.View
              key={detection.read?.id ?? `${detection.plate}-${index}`}
              entering={appear}
              layout={settle}
            >
              {detection.read ? (
                <ReadCard
                  read={detection.read}
                  now={now}
                  onRegister={() => detection.read && openRegistration(detection.read)}
                />
              ) : (
                <UnsavedDetection detection={detection} />
              )}
            </Animated.View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReadingDot({ running }: { running: boolean }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!running || reduceMotion) {
      pulse.set(1);
      return;
    }
    pulse.set(withRepeat(withTiming(0.3, { duration: 800 }), -1, true));
  }, [running, reduceMotion, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        {
          height: 10,
          width: 10,
          borderRadius: radius.pill,
          backgroundColor: running ? palette.danger : palette.steel600,
        },
        style,
      ]}
    />
  );
}

/** Modo de prueba: una foto o un video subido, como si fuera una cámara. */
function FileMode({ now }: { now: number }) {
  const [analysis, setAnalysis] = useState<Analysis>({ phase: 'idle' });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function followJob(jobId: string, file: PickedFile) {
    while (alive.current) {
      await new Promise((resolve) => setTimeout(resolve, JOB_POLL_MS));
      if (!alive.current) return;

      const job = await plateDetectionService.job(jobId);
      if (job.status === 'error') {
        setAnalysis({ phase: 'error', message: job.error ?? 'No pudimos analizar el video.' });
        return;
      }
      if (job.status === 'done') {
        setAnalysis({ phase: 'done', file, kind: 'video', detections: job.detections });
        return;
      }
      setAnalysis({
        phase: 'working',
        file,
        kind: 'video',
        progress: job.progress,
        detections: job.detections,
      });
    }
  }

  async function analyze(file: PickedFile) {
    const checked = validate(file);
    if ('error' in checked) {
      setAnalysis({ phase: 'error', message: checked.error });
      return;
    }

    setAnalysis({ phase: 'working', file, kind: checked.kind, progress: 0, detections: [] });

    try {
      if (checked.kind === 'image') {
        const detections = await plateDetectionService.uploadImage(file);
        if (alive.current) setAnalysis({ phase: 'done', file, kind: 'image', detections });
        return;
      }
      await followJob(await plateDetectionService.uploadVideo(file), file);
    } catch (error) {
      if (alive.current) {
        setAnalysis({
          phase: 'error',
          message: apiMessage(error, 'No pudimos analizar el archivo.'),
        });
      }
    }
  }

  const busy = analysis.phase === 'working';

  return (
    <View style={{ gap: 16 }}>
      <DropZone
        onFile={(file) => void analyze(file)}
        disabled={busy}
        accept={ACCEPT}
        title={busy ? 'Analizando…' : 'Arrastra una foto o un video'}
        hint={HINT}
      />
      <Results analysis={analysis} now={now} />
    </View>
  );
}

function Results({ analysis, now }: { analysis: Analysis; now: number }) {
  if (analysis.phase === 'idle') return null;

  if (analysis.phase === 'error') {
    return <Banner tone="error" message={analysis.message} />;
  }

  const { file, kind, detections } = analysis;
  const working = analysis.phase === 'working';

  return (
    <Animated.View entering={appear} style={{ gap: 12 }}>
      <View style={[plateCard, { gap: 12, padding: 16 }]}>
        <View className="flex-row items-center gap-3">
          {working ? <ActivityIndicator color={palette.accent400} /> : null}
          <View className="flex-1">
            <Text className="text-sm font-semibold text-steel-100" numberOfLines={1}>
              {file.name}
            </Text>
            <Text className="text-xs text-steel-300">{statusLine(analysis)}</Text>
          </View>
        </View>
        {working && kind === 'video' ? <ProgressBar progress={analysis.progress} /> : null}
      </View>

      {!working && detections.length === 0 ? (
        <View style={[plateCard, { flexDirection: 'row', gap: 12, padding: 16 }]}>
          <InfoIcon size={18} color={palette.accent300} />
          <Text className="flex-1 text-sm leading-5 text-steel-300">
            No encontramos placas en este archivo. Prueba con una toma más cercana y de frente,
            donde la placa se vea nítida.
          </Text>
        </View>
      ) : null}

      {detections.map((detection, index) => (
        <Animated.View
          key={detection.read?.id ?? `${detection.plate}-${index}`}
          entering={appear}
          layout={settle}
        >
          {detection.read ? (
            <ReadCard
              read={detection.read}
              now={now}
              onRegister={() => detection.read && openRegistration(detection.read)}
            />
          ) : (
            <UnsavedDetection detection={detection} />
          )}
        </Animated.View>
      ))}
    </Animated.View>
  );
}

function statusLine(analysis: Extract<Analysis, { phase: 'working' | 'done' }>): string {
  const found = analysis.detections.length;
  const plates = found === 1 ? '1 placa encontrada' : `${found} placas encontradas`;

  if (analysis.phase === 'done') {
    return analysis.kind === 'image' ? `Foto analizada · ${plates}` : `Video analizado · ${plates}`;
  }
  if (analysis.kind === 'image') return 'Analizando la foto…';
  return `Analizando el video · ${Math.round(analysis.progress * 100)} % · ${plates}`;
}

function ProgressBar({ progress }: { progress: number }) {
  const reduceMotion = useReducedMotion();
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.set(reduceMotion ? progress : withTiming(progress, { duration: JOB_POLL_MS }));
  }, [progress, reduceMotion, fill]);

  const style = useAnimatedStyle(() => ({ width: `${Math.max(fill.value, 0.02) * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={{
        height: 6,
        overflow: 'hidden',
        borderRadius: radius.pill,
        backgroundColor: palette.ink700,
      }}
    >
      <Animated.View
        style={[
          { height: 6, borderRadius: radius.pill, backgroundColor: palette.accent500 },
          style,
        ]}
      />
    </View>
  );
}

/** Se detectó la placa pero el backend no la guardó: se muestra igual, con la advertencia. */
function UnsavedDetection({ detection }: { detection: Detection }) {
  return (
    <View style={[plateCard, { gap: 12, padding: 16, borderColor: 'rgba(251, 191, 36, 0.45)' }]}>
      <View className="flex-row items-center gap-3">
        <PlateChip plate={detection.plate} colombian={Boolean(detection.vehicleType)} />
        {detection.crop ? (
          <Image
            source={{ uri: detection.crop }}
            contentFit="contain"
            style={{ height: 40, width: 80, borderRadius: 8, backgroundColor: palette.ink950 }}
          />
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        <AlertIcon size={16} color={palette.warning} />
        <Text className="flex-1 text-sm text-state-warning">
          Se detectó, pero no se pudo guardar en el historial. Revisa la conexión del servicio con
          ENTRYX.
        </Text>
      </View>
    </View>
  );
}

function Figure({
  value,
  label,
  alert = false,
}: {
  value: number;
  label: string;
  alert?: boolean;
}) {
  return (
    <View className="flex-1">
      <Text
        className="text-xl font-bold"
        style={[tabular, { color: alert && value > 0 ? palette.danger : palette.steel100 }]}
      >
        {value}
      </Text>
      <Text className="text-xs text-steel-300" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
