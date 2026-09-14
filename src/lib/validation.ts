const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'El correo es obligatorio.';
  if (!EMAIL_RE.test(email)) return 'Escribe un correo válido.';
  return null;
}

export function validateFullName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'El nombre es obligatorio.';
  if (name.length < 3) return 'El nombre es demasiado corto.';
  if (!name.includes(' ')) return 'Escribe nombre y apellido.';
  return null;
}

export function validateIdentification(value: string): string | null {
  const identification = value.trim();
  if (!identification) return 'El número de documento es obligatorio.';
  if (!/^[a-zA-Z0-9.-]{5,20}$/.test(identification)) {
    return 'Usa entre 5 y 20 caracteres, sin espacios.';
  }
  return null;
}

export function validatePhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return 'El teléfono es obligatorio.';

  const digits = phone.replace(/[\s()-]/g, '');
  if (!/^\+?\d{7,15}$/.test(digits)) {
    return 'Escribe un teléfono válido (7 a 15 dígitos).';
  }
  return null;
}

/** El back normaliza a mayúsculas y sin separadores: 5 o 6 alfanuméricos. */
export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validatePlate(value: string): string | null {
  const plate = normalizePlate(value);
  if (!plate) return 'La placa es obligatoria.';
  if (!/^[A-Z0-9]{5,6}$/.test(plate)) return 'La placa debe tener 5 o 6 caracteres.';
  return null;
}

export const OLDEST_MODEL_YEAR = 1950;

export function validateModelYear(value: string): string | null {
  const year = Number(value.trim());
  const maxYear = new Date().getFullYear() + 1;

  if (!value.trim()) return 'El modelo es obligatorio.';
  if (!Number.isInteger(year) || year < OLDEST_MODEL_YEAR || year > maxYear) {
    return `Escribe un año entre ${OLDEST_MODEL_YEAR} y ${maxYear}.`;
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'La contraseña es obligatoria.';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return 'Combina letras y números.';
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Confirma la contraseña.';
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return null;
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string };

export function passwordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, label: 'Sin contraseña' };

  let points = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (value.length >= 12) points += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1;
  if (/\d/.test(value)) points += 1;
  if (/[^\w\s]/.test(value)) points += 1;

  if (points <= 2) return { score: 1, label: 'Débil' };
  if (points <= 3) return { score: 2, label: 'Aceptable' };
  return { score: 3, label: 'Fuerte' };
}
