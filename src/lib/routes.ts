import type { Href } from 'expo-router';

/** Rutas de la app. La zona autenticada vive bajo `/admin`. */
export const routes = {
  login: '/login' as Href,
  register: '/register' as Href,
  forgotPassword: '/forgot-password' as Href,
  adminHome: '/admin/home' as Href,
  adminProfile: '/admin/profile' as Href,
  adminAccess: '/admin/access' as Href,
  adminAccessMonitor: '/admin/access-monitor' as Href,
  adminUsers: '/admin/users' as Href,
  adminUserDetail: (id: number | string): Href => `/admin/users/${id}` as Href,
  adminCheckIn: '/admin/check-in' as Href,
  adminAccessDetail: (id: number | string): Href => `/admin/access/${id}` as Href,
};