import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHero } from '@/components/app/home-hero';
import { GateHome } from '@/components/gate/gate-home';
import { ChevronRightIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { menuForRole } from '@/constants/navigation';
import { isGateRole, roleLabel } from '@/constants/roles';
import { palette, radius } from '@/constants/theme';
import { useSession } from '@/context/session';
import { MAX_CONTENT_WIDTH } from '@/lib/layout';
import { appear } from '@/lib/motion';

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
      {/* Portería llega a su turno: lo urgente, las cámaras y lo que cambió, en una sola vista. */}
      {isGateRole(user.role?.name) ? <GateHome firstName={firstName} /> : null}

      {isGateRole(user.role?.name) ? null : (
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', gap: 24 }}>
          {/* Credencial: el dato que el usuario viene a mirar, dentro de la cabecera. */}
          <Animated.View entering={appear}>
            <HomeHero firstName={firstName}>
              <Text className="text-sm text-steel-300">Tu acceso</Text>
              <Text className="mt-1 text-xl font-semibold text-steel-100">
                {roleLabel(user.role?.name)}
              </Text>
              <Text className="mt-1 text-sm text-steel-300">
                {user.identification
                  ? `${user.identificationType?.name ?? 'Documento'} ${user.identification}`
                  : 'Documento sin registrar'}
              </Text>
            </HomeHero>
          </Animated.View>

          <View className="gap-3">
            <Animated.View entering={appear}>
              <Text className="text-base font-semibold text-steel-100">Accesos rápidos</Text>
            </Animated.View>

            {shortcuts.map((item, index) => {
              const Icon = item.icon;
              const available = Boolean(item.href);

              return (
                <Animated.View key={item.key} entering={appear}>
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
                      borderColor: palette.hairline,
                      backgroundColor: palette.ink800,
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
                        backgroundColor: available ? 'rgba(47, 128, 237, 0.14)' : palette.ink700,
                      }}
                    >
                      <Icon size={21} color={available ? palette.accent400 : palette.steel500} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-base font-medium text-steel-100">{item.label}</Text>
                      {available ? null : (
                        <Text className="mt-0.5 text-xs text-steel-400">Disponible pronto</Text>
                      )}
                    </View>

                    {available ? <ChevronRightIcon size={18} color={palette.steel500} /> : null}
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
