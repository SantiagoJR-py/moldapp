import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import {
  ClipboardIcon,
  HomeIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { routes } from '@/lib/routes';
import { RoleName } from './roles';

type IconComponent = ComponentType<{ size?: number; color?: string }>;

export type NavItem = {
  key: string;
  label: string;
  icon: IconComponent;
  /** Sin `href` el ítem se muestra deshabilitado: la pantalla todavía no existe. */
  href?: Href;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const GENERAL: NavSection = {
  title: 'General',
  items: [
    { key: 'home', label: 'Inicio', icon: HomeIcon, href: routes.adminHome },
    { key: 'profile', label: 'Mi perfil', icon: UserIcon, href: routes.adminProfile },
    { key: 'my-access', label: 'Mis ingresos', icon: ClipboardIcon, href: routes.adminAccess },
  ],
};

const BY_ROLE: Record<string, NavSection> = {
  [RoleName.WARDEN]: {
    title: 'Portería',
    items: [
      { key: 'check-in', label: 'Registrar ingreso', icon: ShieldIcon, href: routes.adminCheckIn },
    ],
  },
  [RoleName.ADMINISTRATIVE_STAFF]: {
    title: 'Administración',
    items: [
      {
        key: 'access-monitor',
        label: 'Ingresos campus',
        icon: ClipboardIcon,
        href: routes.adminAccessMonitor,
      },
      { key: 'users', label: 'Usuarios', icon: UsersIcon, href: routes.adminUsers },
      { key: 'reports', label: 'Reportes', icon: ClipboardIcon },
    ],
  },
};

export function menuForRole(roleName: string | undefined): NavSection[] {
  const roleSection = roleName ? BY_ROLE[roleName] : undefined;

  return roleSection ? [GENERAL, roleSection] : [GENERAL];
}
