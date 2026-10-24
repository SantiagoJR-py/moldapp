/**
 * Normaliza lo que sale del código de barras del carnet.
 * Suele traer la cédula; a veces viene con prefijos o espacios.
 */
export function normalizeScannedDocument(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Si hay un bloque largo de dígitos (cédula típica 6–12), lo preferimos.
  const digitBlocks = trimmed.match(/\d{6,12}/g);
  if (digitBlocks?.length) {
    return digitBlocks.sort((a, b) => b.length - a.length)[0];
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 5) return digitsOnly;

  return trimmed.replace(/[\s.-]/g, '');
}
