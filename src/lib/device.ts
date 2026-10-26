import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { storage } from './storage';

const FINGERPRINT_KEY = 'entryx.fingerprint';

/**
 * Datos que el backend guarda en `sessions` (userAgent, browser, ip, device, os,
 * fingerPrint, report). La `ip` la resuelve el servidor con la request.
 */
export type ClientInfo = {
  userAgent: string;
  browser: string;
  device: string;
  os: string;
  fingerPrint: string;
};

function browserName(): string {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return `expo/${Platform.OS}`;
  }

  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Unknown';
}

function userAgent(): string {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }

  return `ENTRYX/${Platform.OS} ${Device.osName ?? ''} ${Device.osVersion ?? ''}`.trim();
}

/** Identificador estable por instalación; no es un dato de seguridad, solo correlaciona sesiones. */
async function fingerPrint(): Promise<string> {
  const stored = await storage.getItem(FINGERPRINT_KEY);
  if (stored) return stored;

  const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await storage.setItem(FINGERPRINT_KEY, generated);
  return generated;
}

export async function getClientInfo(): Promise<ClientInfo> {
  return {
    userAgent: userAgent(),
    browser: browserName(),
    device: Device.modelName ?? Device.deviceName ?? Platform.OS,
    os: `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''}`.trim(),
    fingerPrint: await fingerPrint(),
  };
}

/**
 * El backend lee estas cabeceras para construir el registro de `sessions`
 * cuando un hash de recuperación no coincide.
 */
export async function clientHeaders(): Promise<Record<string, string>> {
  const info = await getClientInfo();

  return {
    'X-Client-User-Agent': info.userAgent,
    'X-Client-Browser': info.browser,
    'X-Client-Device': info.device,
    'X-Client-Os': info.os,
    'X-Client-Fingerprint': info.fingerPrint,
    'X-Client-Platform': Platform.OS,
  };
}
