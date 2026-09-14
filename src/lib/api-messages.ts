import { ApiError } from './http';

/** moldapp-back responde en inglés; la interfaz está en español. */
const TRANSLATIONS: Record<string, string> = {
  'Email already registered': 'Ese correo ya está registrado.',
  'Identification already registered': 'Ese número de documento ya está registrado.',
  'Phone already registered': 'Ese teléfono ya está registrado.',
  'Invalid email or password': 'Correo o contraseña incorrectos.',
  'User is not enabled': 'Tu cuenta está inactiva. Comunícate con el área administrativa.',
  'User not found': 'No encontramos tu cuenta.',
  'Invalid hash': 'El enlace no es válido o ya fue utilizado.',
  'Nothing to update': 'No hay cambios por guardar.',
  Unauthorized: 'Tu sesión expiró. Inicia sesión de nuevo.',
  'Invalid token': 'Tu sesión expiró. Inicia sesión de nuevo.',
  'photo is required': 'Selecciona una imagen.',
  'The image must be 3 MB or smaller': 'La imagen debe pesar 3 MB o menos.',
  'Only JPG, PNG or WEBP images are allowed': 'Solo se aceptan imágenes JPG, PNG o WEBP.',
};

export function apiMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  return TRANSLATIONS[error.message] ?? error.message;
}
