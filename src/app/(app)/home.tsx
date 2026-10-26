import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand/logo';
import { GateHome } from '@/components/gate/gate-home';
import { ChevronRightIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { menuForRole } from '@/constants/navigation';
import { isGateRole, roleLabel } from '@/constants/roles';
import { motion, palette, radius, shadows } from '@/constants/theme';
import { useSession } from '@/context/session';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Entrada escalonada: cada bloque llega un pelo despues del anterior. */
function enter(index: number) {
  return FadeInDown.duration(motion.slow)
    .delay(index * 70)
    .springify()
    .damping(20);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  if (!user) return null;

  const firstName = user.fullName.trim().split(/\s+/)[0];
  const sections = menuForRole(user.role?.name);
  const shortcuts = sections
    .flatMap((section) => section.items)
    .filter((item) => item.key !== 'home');

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 24 }}
    >
      <Animated.View entering={enter(0)} style={{ gap: 4 }}>
        <Text className="text-sm text-steel-400">{greeting()},</Text>
        <Text className="text-3xl font-bold tracking-tight text-steel-100">{firstName}</Text>
      </Animated.View>

      {/* Portería llega a su turno: lo urgente, las cámaras y lo que cambió, en una sola vista. */}
      {isGateRole(user.role?.name) ? <GateHome /> : null}

      {isGateRole(user.role?.name) ? null : (
        <>
          {/* Credencial: el dato que el usuario viene a mirar, arriba y sin ruido. */}
          <Animated.View entering={enter(1)}>
            <View
              style={{
                borderRadius: radius.card,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: palette.ink700,
                backgroundColor: palette.ink900,
                padding: 20,
                overflow: 'hidden',
                boxShadow: shadows.raised,
              }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-[11px] font-medium uppercase tracking-widest text-steel-500">
                    Tu acceso
                  </Text>
                  <Text className="mt-2 text-xl font-semibold text-steel-100">
                    {roleLabel(user.role?.name)}
                  </Text>
                  <Text className="mt-1 text-sm text-steel-500">
                    {user.identification
                      ? `${user.identificationType?.name ?? 'Documento'} ${user.identification}`
                      : 'Documento sin registrar'}
                  </Text>
                </View>

                <Wordmark size="sm" style={{ opacity: 0.55 }} />
              </View>
            </View>
          </Animated.View>

          <View className="gap-3">
            <Animated.View entering={enter(2)}>
              <Text className="text-[11px] font-medium uppercase tracking-widest text-steel-500">
                Accesos rápidos
              </Text>
            </Animated.View>

            {shortcuts.map((item, index) => {
              const Icon = item.icon;
              const available = Boolean(item.href);

              return (
                <Animated.View key={item.key} entering={enter(3 + index)}>
                  <PressableScale
                    accessibilityLabel={item.label}
                    disabled={!available}
                    haptic={available}
                    onPress={() => item.href && router.navigate(item.href)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 16,
                      borderRadius: radius.card,
                      borderCurve: 'continuous',
                      borderWidth: 1,
                      borderColor: palette.ink700,
                      backgroundColor: palette.ink900,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      opacity: available ? 1 : 0.45,
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
                        backgroundColor: available ? 'rgba(47, 128, 237, 0.14)' : palette.ink800,
                      }}
                    >
                      <Icon size={21} color={available ? palette.accent400 : palette.steel500} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-base font-medium text-steel-100">{item.label}</Text>
                      {available ? null : (
                        <Text className="mt-0.5 text-xs text-steel-500">Disponible pronto</Text>
                      )}
                    </View>

                    {available ? <ChevronRightIcon size={18} color={palette.steel500} /> : null}
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
