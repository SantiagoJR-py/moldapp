import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { homeRouteFor } from '@/constants/navigation';
import { useSession } from '@/context/session';
import { entryRoute } from '@/lib/surface';

export default function Index() {
  const { user, loading } = useSession();

  if (loading) {
    return <LoadingScreen />;
  }

  return <Redirect href={user ? homeRouteFor(user.role?.name) : entryRoute} />;
}
