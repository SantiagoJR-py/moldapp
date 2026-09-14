import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { LogoMark } from '@/components/brand/logo';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/session';
import { routes } from '@/lib/routes';
import { entryRoute } from '@/lib/surface';

export default function NotFoundScreen() {
  const { user } = useSession();

  return (
    <AuthScreen>
      <Card>
        <View className="items-center gap-4">
          <LogoMark size={44} />
          <Text className="text-lg font-semibold text-white">Página no encontrada</Text>
          <Text className="text-center text-sm leading-5 text-steel-400">
            El enlace que abriste no existe o no está disponible en esta plataforma.
          </Text>
          <Button
            label="Volver al inicio"
            onPress={() => router.replace(user ? routes.adminHome : entryRoute)}
          />
        </View>
      </Card>
    </AuthScreen>
  );
}
