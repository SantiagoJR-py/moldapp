import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Isotype, Wordmark } from '@/components/brand/logo';
import { PressableScale } from '@/components/ui/pressable-scale';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { Avatar } from './avatar';

/**
 * Barra superior del celular: la marca y el acceso al perfil. Cada pantalla pone su propio
 * título grande debajo, como en iOS; la navegación va abajo, en las pestañas.
 */
export function TopBar() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: palette.hairline,
        backgroundColor: palette.ink900,
        paddingHorizontal: 16,
        paddingBottom: 10,
        paddingTop: insets.top + 10,
      }}
    >
      <View className="flex-row items-center gap-2.5">
        <Isotype size={28} />
        <Wordmark size="sm" />
      </View>

      {user ? (
        <PressableScale
          accessibilityLabel="Ir a mi perfil"
          depth={0.9}
          onPress={() => router.navigate('/profile')}
          style={{ height: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Avatar fullName={user.fullName} urlImage={user.urlImage} size={34} />
        </PressableScale>
      ) : null}
    </View>
  );
}
