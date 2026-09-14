import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark, Wordmark } from '@/components/brand/logo';
import { CloseIcon, LogoutIcon } from '@/components/ui/icons';
import { menuForRole, type NavItem } from '@/constants/navigation';
import { roleLabel } from '@/constants/roles';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { entryRoute } from '@/lib/surface';
import { Avatar } from './avatar';

type SideMenuProps = {
  /** El botón de cerrar solo aparece cuando el menú flota sobre el contenido. */
  onClose?: () => void;
};

export function SideMenu({ onClose }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, signOut } = useSession();

  const sections = menuForRole(user?.role?.name);

  function go(item: NavItem) {
    if (!item.href) return;

    onClose?.();
    router.navigate(item.href);
  }

  return (
    <View
      className="h-full border-r border-ink-700 bg-ink-900"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row items-center justify-between px-5 pb-6">
        <View className="flex-row items-center gap-3">
          <LogoMark size={34} />
          <Wordmark size="sm" />
        </View>

        {onClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú"
            hitSlop={10}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-800 active:opacity-70"
          >
            <CloseIcon size={18} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} className="px-3 pb-5">
            <Text className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-steel-500">
              {section.title}
            </Text>

            {section.items.map((item) => {
              const active = item.href ? pathname === item.href : false;
              const Icon = item.icon;

              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: !item.href }}
                  disabled={!item.href}
                  onPress={() => go(item)}
                  className={`mb-1 flex-row items-center gap-3 rounded-field px-3 py-2.5 ${
                    active ? 'bg-accent-500/15' : 'active:bg-ink-800'
                  } ${item.href ? '' : 'opacity-45'}`}
                >
                  <Icon size={18} color={active ? palette.accent300 : palette.steel400} />
                  <Text
                    className={`flex-1 text-sm ${active ? 'font-medium text-accent-200' : 'text-steel-200'}`}
                  >
                    {item.label}
                  </Text>
                  {item.href ? null : (
                    <View className="rounded-full bg-ink-700 px-2 py-0.5">
                      <Text className="text-[10px] text-steel-400">Pronto</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {user ? (
        <View className="mx-3 mt-2 gap-3 rounded-field border border-ink-700 bg-ink-800 p-3">
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

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose?.();
              void signOut().then(() => router.replace(entryRoute));
            }}
            className="flex-row items-center gap-2 rounded-field px-1 py-1.5 active:opacity-70"
          >
            <LogoutIcon size={17} color={palette.steel400} />
            <Text className="text-sm text-steel-300">Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
