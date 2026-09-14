import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MenuIcon } from '@/components/ui/icons';
import { roleLabel } from '@/constants/roles';
import { useSession } from '@/context/session';
import { Avatar } from './avatar';

type TopBarProps = {
  onOpenMenu: () => void;
  showMenuButton: boolean;
};

/** Barra superior con la identidad del usuario: foto, nombre, rol y estado. */
export function TopBar({ onOpenMenu, showMenuButton }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  const enabled = user?.state === 'ENABLED';

  return (
    <View
      className="flex-row items-center gap-3 border-b border-ink-700 bg-ink-900/95 px-4 pb-3"
      style={{ paddingTop: insets.top + 12 }}
    >
      {showMenuButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú"
          hitSlop={8}
          onPress={onOpenMenu}
          className="h-10 w-10 items-center justify-center rounded-field border border-ink-600 bg-ink-800 active:opacity-70"
        >
          <MenuIcon size={20} />
        </Pressable>
      ) : null}

      {user ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a mi perfil"
          onPress={() => router.navigate('/profile')}
          className="flex-1 flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar fullName={user.fullName} urlImage={user.urlImage} size={42} />

          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-semibold text-white">
              {user.fullName}
            </Text>

            <View className="mt-1 flex-row items-center gap-2">
              <View className="rounded-full border border-accent-500/40 bg-accent-500/10 px-2 py-0.5">
                <Text className="text-[11px] text-accent-300">{roleLabel(user.role?.name)}</Text>
              </View>

              <View className="flex-row items-center gap-1.5">
                <View
                  className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-state-success' : 'bg-state-warning'}`}
                />
                <Text className="text-[11px] text-steel-500">
                  {enabled ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      ) : (
        <View className="flex-1" />
      )}
    </View>
  );
}
