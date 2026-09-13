import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand/logo';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { entryRoute } from '@/lib/surface';

/** Marcador de posición: destino tras el login mientras se define el home real. */
export default function HomeScreen() {
  const { user, loading, signOut } = useSession();

  if (loading) {
    return (
      <AuthScreen>
        <View className="items-center py-10">
          <ActivityIndicator color={palette.accent400} />
        </View>
      </AuthScreen>
    );
  }

  if (!user) {
    return <Redirect href={entryRoute} />;
  }

  return (
    <AuthScreen>
      <View className="gap-8">
        <BrandHeader tagline={`Hola, ${user.fullName.split(' ')[0]}`} />

        <Card>
          <View className="gap-4">
            <Text className="text-sm text-steel-400">Sesión iniciada como</Text>
            <Text className="text-base text-steel-100">{user.email}</Text>
            {user.role ? (
              <View className="self-start rounded-full border border-accent-500/40 bg-accent-500/10 px-3 py-1">
                <Text className="text-xs text-accent-300">{user.role.name}</Text>
              </View>
            ) : null}
            <Button
              label="Cerrar sesión"
              variant="outline"
              onPress={() => {
                void signOut().then(() => router.replace(entryRoute));
              }}
            />
          </View>
        </Card>
      </View>
    </AuthScreen>
  );
}
