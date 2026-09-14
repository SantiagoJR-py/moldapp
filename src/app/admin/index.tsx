import { Redirect } from 'expo-router';

import { routes } from '@/lib/routes';

export default function AdminIndex() {
  return <Redirect href={routes.adminHome} />;
}
