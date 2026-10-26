import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import {
  BellIcon,
  CarIcon,
  ClipboardIcon,
  HomeIcon,
  ScanIcon,
  UserIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/ui/icons';
import { isGateRole, RoleName } from './roles';

type IconComponent = ComponentType<{ size?: number; color?: string }>;

export type NavItem = {
  key: string;
  label: string;
  icon: IconComponent;
  /** Sin `href` el ítem se muestra deshabilitado: la pantalla todavía no existe. */
  href?: Href;
  /** Muestra el número de alertas pendientes junto al ítem. */
  badge?: 'alerts';
  /** Nombre corto para la barra de pestañas, donde no cabe el largo. */
  tabLabel?: string;
  /** Rutas hijas que también encienden este ítem (la inscripción vive bajo Alertas). */
  also?: string[];
};

export function isActive(item: NavItem, pathname: string): boolean {
  return item.href === pathname || Boolean(item.also?.some((path) => pathname.startsWith(path)));
}

export type NavSection = {
  title: string;
  items: NavItem[];
};

const HOME: NavItem = { key: 'home', label: 'Inicio', icon: HomeIcon, href: '/home' };
const PROFILE: NavItem = {
  key: 'profile',
  label: 'Mi perfil',
  tabLabel: 'Perfil',
  icon: UserIcon,
  href: '/profile',
};
const MY_VEHICLES: NavItem = {
  key: 'my-vehicles',
  label: 'Mis vehículos',
  tabLabel: 'Vehículos',
  icon: CarIcon,
  href: '/vehicles',
  also: ['/scan-card'],
};

const MONITOR: NavItem = {
  key: 'monitor',
  label: 'Cámaras en vivo',
  tabLabel: 'En vivo',
  icon: VideoIcon,
  href: '/monitor',
  also: ['/camera/'],
};
const ALERTS: NavItem = {
  key: 'alerts',
  label: 'Alertas',
  icon: BellIcon,
  href: '/alerts',
  badge: 'alerts',
  also: ['/gate-register'],
};
const ACCESS_LOG: NavItem = {
  key: 'access-log',
  label: 'Entradas y salidas',
  tabLabel: 'Accesos',
  icon: ClipboardIcon,
  href: '/access-log',
};
const DETECTION: NavItem = {
  key: 'detection',
  label: 'Detección manual',
  icon: ScanIcon,
  href: '/detection',
};

/**
 * Portería es una sola consola en el PC de la caseta y en el celular: lo primero son las
 * cámaras, después las alertas por resolver y el historial.
 */
const GATE: NavSection = {
  title: 'Portería',
  items: [MONITOR, ALERTS, ACCESS_LOG, DETECTION],
};

const ADMINISTRATION: NavSection = {
  title: 'Administración',
  items: [
    { key: 'users', label: 'Usuarios', icon: UsersIcon, href: '/users' },
    { key: 'reports', label: 'Reportes', icon: ClipboardIcon },
  ],
};

/**
 * Lo propio de cada persona. Lo tiene todo el mundo: un vigilante o alguien de
 * administración también entra a la institución y también registra su vehículo.
 */
const PERSONAL: NavSection = {
  title: 'Mis registros',
  items: [MY_VEHICLES, { key: 'my-access', label: 'Mis ingresos', icon: ClipboardIcon }],
};

/**
 * Menú lateral del PC. La sección del rol se **suma** a la personal, no la reemplaza: así
 * Portería y Administración también llegan a sus propios vehículos.
 */
export function menuForRole(roleName: string | undefined): NavSection[] {
  if (roleName === RoleName.WARDEN) {
    return [
      { title: 'General', items: [HOME] },
      GATE,
      PERSONAL,
      { title: 'Cuenta', items: [PROFILE] },
    ];
  }

  // Administración también supervisa la portería.
  if (roleName === RoleName.ADMINISTRATIVE_STAFF) {
    return [
      { title: 'General', items: [HOME] },
      GATE,
      ADMINISTRATION,
      PERSONAL,
      { title: 'Cuenta', items: [PROFILE] },
    ];
  }

  return [{ title: 'General', items: [HOME, PROFILE] }, PERSONAL];
}

/**
 * Pestañas del celular: entre dos y cinco destinos, nunca acciones. La detección manual no es
 * pestaña: se abre desde "En vivo" y desde Inicio. "Mis vehículos" de Portería está en Inicio.
 */
export function tabsForRole(roleName: string | undefined): NavItem[] {
  if (isGateRole(roleName)) {
    return [HOME, MONITOR, ALERTS, ACCESS_LOG, PROFILE];
  }

  return [HOME, MY_VEHICLES, PROFILE];
}

/**
 * Adónde llega cada rol al iniciar sesión: Inicio, que para Portería resume el turno (lo que
 * falta resolver, las cámaras y los cambios recientes).
 */
export function homeRouteFor(_roleName: string | undefined): Href {
  return '/home';
}
