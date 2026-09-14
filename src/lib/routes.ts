/** Rutas de la app. La zona autenticada vive bajo `/admin`. */
export const routes = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  adminHome: '/admin/home',
  adminProfile: '/admin/profile',
  adminVehicles: '/admin/vehicles',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
