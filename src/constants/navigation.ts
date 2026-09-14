import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import {
  CarIcon,
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
  ],
};

const BY_ROLE: Record<string, NavSection> = {
  [RoleName.WARDEN]: {
    title: 'Portería',
    items: [
      { key: 'check-in', label: 'Registrar ingreso', icon: ShieldIcon },
      { key: 'access-log', label: 'Historial de accesos', icon: ClipboardIcon },
    ],
  },
  [RoleName.ADMINISTRATIVE_STAFF]: {
    title: 'Administración',
    items: [
      { key: 'users', label: 'Usuarios', icon: UsersIcon },
      { key: 'reports', label: 'Reportes', icon: ClipboardIcon },
    ],
  },
};

const DEFAULT_ROLE_SECTION: NavSection = {
  title: 'Mis registros',
  items: [
    { key: 'my-vehicles', label: 'Mis vehículos', icon: CarIcon, href: routes.adminVehicles },
    { key: 'my-access', label: 'Mis ingresos', icon: ClipboardIcon },
  ],
};

export function menuForRole(roleName: string | undefined): NavSection[] {
  const roleSection = roleName ? (BY_ROLE[roleName] ?? DEFAULT_ROLE_SECTION) : DEFAULT_ROLE_SECTION;

  return [GENERAL, roleSection];
}
