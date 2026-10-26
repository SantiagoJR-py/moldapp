import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Isotype } from '@/components/brand/logo';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { entryRoute } from '@/lib/surface';

export default function NotFoundScreen() {
  return (
    <AuthScreen>
      <Card>
        <View className="items-center gap-4">
          <Isotype size={52} />
          <Text className="text-xl font-bold tracking-tight text-steel-100">
            Página no encontrada
          </Text>
          <Text className="text-center text-sm leading-5 text-steel-300">
            El enlace que abriste no existe o no está disponible en esta plataforma.
          </Text>
          <Button label="Volver al inicio" onPress={() => router.replace(entryRoute)} />
        </View>
      </Card>
    </AuthScreen>
  );
}
