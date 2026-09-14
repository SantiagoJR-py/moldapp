import { Slot } from 'expo-router';

import { GuestGate } from '@/components/auth-gate';

/**
 * Zona pública de autenticación (`/login`, `/register`, `/forgot-password`).
 * Si ya hay sesión, GuestGate redirige a `/admin/home`.
 */
export default function GuestLayout() {
  return (
    <GuestGate>
      <Slot />
    </GuestGate>
  );
}
