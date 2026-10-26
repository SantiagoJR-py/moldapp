import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertCard, ResolvedRow } from '@/components/gate/alert-card';
import { LiveStatus } from '@/components/plates/live-status';
import { plateCard } from '@/components/plates/styles';
import { Banner } from '@/components/ui/banner';
import { ShieldIcon } from '@/components/ui/icons';
import { GateOnly } from '@/components/gate-only';
import { motion, palette } from '@/constants/theme';
import { useGateAlerts } from '@/context/gate-alerts';
import { useNow } from '@/lib/use-now';

const SETTLE = LinearTransition.duration(motion.base).springify().damping(22);

export default function AlertsRoute() {
  return (
    <GateOnly>
      <AlertsScreen />
    </GateOnly>
  );
}

function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { visit } = useLocalSearchParams<{ visit?: string }>();
  const { pending, resolvedToday, status, error } = useGateAlerts();
  const now = useNow();

  const count = pending.length;

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Animated.View
        entering={FadeInDown.duration(motion.slow).springify().damping(20)}
        style={{ gap: 8 }}
      >
        <Text className="text-3xl font-bold tracking-tight text-steel-100">Alertas</Text>
        <Text className="text-sm leading-5 text-steel-400">
          {count === 0
            ? 'Ningún vehículo sin registrar está esperando.'
            : count === 1
              ? 'Un vehículo entró sin estar inscrito. Inscríbelo con su tarjeta de propiedad o déjalo pasar como visita.'
              : `${count} vehículos entraron sin estar inscritos. Inscríbelos con su tarjeta de propiedad o déjalos pasar como visita.`}
        </Text>
        <LiveStatus status={status} />
      </Animated.View>

      {error && status !== 'live' ? <Banner tone="error" message={error} /> : null}

      {count === 0 && status === 'live' ? (
        <Animated.View
          entering={FadeIn.duration(motion.base)}
          style={[
            plateCard,
            { alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 36 },
          ]}
        >
          <ShieldIcon size={34} color={palette.success} />
          <Text className="text-center text-base font-semibold text-steel-100">Todo en orden</Text>
          <Text className="text-center text-sm leading-5 text-steel-400">
            Cuando una cámara lea la placa de un vehículo que no está inscrito, aparece aquí y suena
            una alerta en todas las pantallas de portería.
          </Text>
        </Animated.View>
      ) : (
        <View style={{ gap: 12 }}>
          {pending.map((alert, index) => (
            <Animated.View
              key={alert.id}
              entering={FadeInDown.duration(motion.base)
                .delay(Math.min(index, 5) * 55)
                .springify()
                .damping(20)}
              exiting={FadeOut.duration(motion.fast)}
              layout={SETTLE}
            >
              {/* La clave cambia al pedir la visita: la tarjeta se monta de nuevo con el formulario
                  abierto, también si la persona ya estaba en esta pantalla. */}
              <AlertCard
                key={visit === String(alert.id) ? `${alert.id}-visita` : alert.id}
                alert={alert}
                now={now}
                startWithVisit={visit === String(alert.id)}
              />
            </Animated.View>
          ))}
        </View>
      )}

      {resolvedToday.length > 0 ? (
        <Animated.View layout={SETTLE} style={{ gap: 10 }}>
          <Text className="text-lg font-semibold text-steel-100">Resueltas hoy</Text>
          <View style={[plateCard, { paddingHorizontal: 16, paddingVertical: 4 }]}>
            {resolvedToday.map((alert, index) => (
              <View
                key={alert.id}
                style={
                  index > 0 ? { borderTopWidth: 1, borderTopColor: palette.ink700 } : undefined
                }
              >
                <ResolvedRow alert={alert} />
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}
