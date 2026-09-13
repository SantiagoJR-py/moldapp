import { Redirect } from 'expo-router';

import { entryRoute } from '@/lib/surface';

export default function Index() {
  return <Redirect href={entryRoute} />;
}
