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
