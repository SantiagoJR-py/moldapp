import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronRightIcon } from '@/components/ui/icons';
import { menuForRole } from '@/constants/navigation';
import { roleLabel } from '@/constants/roles';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  if (!user) return null;

  const firstName = user.fullName.trim().split(/\s+/)[0];
  const sections = menuForRole(user.role?.name);
  const shortcuts = sections.flatMap((section) => section.items).filter((item) => item.key !== 'home');

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 20 }}
    >
      <View className="gap-1">
        <Text className="text-sm text-steel-400">{greeting()},</Text>
        <Text className="text-2xl font-semibold text-white">{firstName}</Text>
      </View>

      <View className="rounded-card border border-ink-600 bg-ink-900 p-5">
        <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
          Tu acceso
        </Text>
        <Text className="mt-2 text-base text-steel-100">{roleLabel(user.role?.name)}</Text>
        <Text className="mt-1 text-sm text-steel-500">
          {user.identificationType?.name ?? 'Documento sin registrar'}
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
          Accesos rápidos
        </Text>

        {shortcuts.map((item) => {
          const Icon = item.icon;
          const available = Boolean(item.href);

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ disabled: !available }}
              disabled={!available}
              onPress={() => item.href && router.navigate(item.href)}
              className={`flex-row items-center gap-4 rounded-card border border-ink-600 bg-ink-900 px-4 py-4 ${
                available ? 'active:bg-ink-800' : 'opacity-45'
              }`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-field bg-accent-500/10">
                <Icon size={20} color={palette.accent300} />
              </View>

              <View className="flex-1">
                <Text className="text-base text-steel-100">{item.label}</Text>
                {available ? null : (
                  <Text className="mt-0.5 text-xs text-steel-500">Disponible pronto</Text>
                )}
              </View>

              {available ? <ChevronRightIcon size={18} color={palette.steel500} /> : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
