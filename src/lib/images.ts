import { env } from './env';

/** El backend guarda rutas relativas como `/uploads/avatars/x.jpg`. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url) || url.startsWith('data:')) return url;

  return `${env.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
