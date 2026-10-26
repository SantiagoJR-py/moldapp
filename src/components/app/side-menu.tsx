import { router, usePathname } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Isotype, Wordmark } from '@/components/brand/logo';
import { LogoutIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { isActive, menuForRole, type NavItem } from '@/constants/navigation';
import { roleLabel } from '@/constants/roles';
import { motion, palette, radius } from '@/constants/theme';
import { useGateAlerts } from '@/context/gate-alerts';
import { useSession } from '@/context/session';
import { entryRoute } from '@/lib/surface';
import { Avatar } from './avatar';

/** Menú fijo del PC de portería. En el celular la navegación va en la barra de pestañas. */
export function SideMenu() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const { pending } = useGateAlerts();

  const sections = menuForRole(user?.role?.name);

  function go(item: NavItem) {
    if (item.href) router.navigate(item.href);
  }

  return (
    <View
      style={{
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: palette.ink700,
        backgroundColor: palette.ink900,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <View className="flex-row items-center gap-3 px-5 pb-7">
        <Isotype size={34} />
        <Wordmark size="sm" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} className="px-3 pb-6">
            <Text className="px-3 pb-2.5 text-[11px] font-medium uppercase tracking-widest text-steel-500">
              {section.title}
            </Text>

            {section.items.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              const count = item.badge === 'alerts' ? pending.length : 0;

              return (
                <PressableScale
                  key={item.key}
                  accessibilityLabel={item.label}
                  disabled={!item.href}
                  haptic={Boolean(item.href)}
                  depth={0.97}
                  onPress={() => go(item)}
                  style={{
                    marginBottom: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: radius.field,
                    borderCurve: 'continuous',
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                    backgroundColor: active ? 'rgba(47, 128, 237, 0.16)' : 'transparent',
                    opacity: item.href ? 1 : 0.45,
                  }}
                >
                  {/* Barra de acento en el item activo: dice donde estas sin
                      depender solo del color de fondo. */}
                  {active ? (
                    <Animated.View
                      entering={FadeIn.duration(motion.fast)}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 10,
                        bottom: 10,
                        width: 3,
                        borderRadius: 2,
                        backgroundColor: palette.accent400,
                      }}
                    />
                  ) : null}

                  <Icon size={18} color={active ? palette.accent400 : palette.steel400} />
                  <Text
                    className={`flex-1 text-sm ${
                      active ? 'font-medium text-accent-200' : 'text-steel-200'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {count > 0 ? (
                    <View
                      style={{
                        minWidth: 22,
                        alignItems: 'center',
                        borderRadius: radius.pill,
                        backgroundColor: palette.danger,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        className="text-xs font-bold text-ink-950"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {count}
                      </Text>
                    </View>
                  ) : null}
                  {item.href ? null : (
                    <View className="rounded-pill bg-ink-700 px-2 py-0.5">
                      <Text className="text-[10px] text-steel-400">Pronto</Text>
                    </View>
                  )}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {user ? (
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 8,
            gap: 12,
            borderRadius: radius.field,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: palette.ink700,
            backgroundColor: palette.ink800,
            padding: 12,
          }}
        >
          <View className="flex-row items-center gap-3">
            <Avatar fullName={user.fullName} urlImage={user.urlImage} size={36} />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-sm font-medium text-steel-100">
                {user.fullName}
              </Text>
              <Text numberOfLines={1} className="text-xs text-steel-500">
                {roleLabel(user.role?.name)}
              </Text>
            </View>
          </View>

          <PressableScale
            accessibilityLabel="Cerrar sesión"
            depth={0.97}
            onPress={() => {
              void signOut().then(() => router.replace(entryRoute));
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: radius.field,
              borderCurve: 'continuous',
              paddingHorizontal: 4,
              paddingVertical: 6,
            }}
          >
            <LogoutIcon size={17} color={palette.steel400} />
            <Text className="text-sm text-steel-300">Cerrar sesión</Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}
