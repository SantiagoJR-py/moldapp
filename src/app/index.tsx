import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { routes } from '@/lib/routes';
import { entryRoute } from '@/lib/surface';

export default function Index() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-950">
        <ActivityIndicator color={palette.accent400} />
      </View>
    );
  }

  return <Redirect href={user ? routes.adminHome : entryRoute} />;
}
