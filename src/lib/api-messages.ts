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
  'Vehicle Not Found': 'No encontramos ese vehículo.',
  'License plate already registered': 'Esa placa ya está registrada.',
  'Version does not belong to the brand': 'Esa versión no corresponde a la marca elegida.',
  'licensePlateNumber must have 5 or 6 letters or digits': 'La placa debe tener 5 o 6 caracteres.',
  'brandId and versionId are required': 'Elige la marca y la versión.',
  'model must be a valid year': 'Escribe un año de modelo válido.',
  Forbidden: 'Esta sección es solo para Portería y Administración.',
  'Vision service unavailable':
    'El servicio de lectura no está disponible en este equipo. Revisa que esté encendido (python servidor.py).',
  'Unsupported file type':
    'Ese tipo de archivo no se puede analizar. Usa JPG, PNG o WEBP, o un video MP4, MOV o AVI.',
  'The file is too large': 'El archivo es demasiado grande. El máximo es 300 MB para videos.',
  'Only images are allowed here': 'Aquí solo se aceptan fotos.',
  'Only videos are allowed here': 'Aquí solo se aceptan videos.',
  'The image must be 10 MB or smaller': 'La imagen debe pesar 10 MB o menos.',
  'Unreadable file':
    'No pudimos leer el archivo. Puede estar dañado o en un formato no compatible.',
  'Job not found': 'El análisis ya no está disponible. Sube el archivo de nuevo.',
  'licensePlateNumber must be a Colombian plate (ABC123, ABC12D or ABC12)':
    'Usa el formato de placa colombiana: ABC123, ABC12D o ABC12.',
  'brand is required': 'Indica la marca.',
  'line is required': 'Indica la línea.',
  'Brand not found': 'Esa marca ya no existe en el catálogo.',
  'Alert Not Found': 'Esa alerta ya no existe.',
  'Alert already resolved': 'Otra persona de portería ya resolvió esta alerta.',
  'note is required': 'Escribe el motivo de la visita.',
  'holder fullName is required': 'Escribe el nombre completo del propietario.',
  'holder identificationTypeId is required': 'Elige el tipo de documento del propietario.',
  'holder identification is invalid': 'Revisa el número de documento del propietario.',
  'Camera not found': 'Esa cámara ya no está configurada en el servicio de visión.',
  'frame is required': 'No llegó la foto de la cámara.',
  'Plate read Not Found': 'Esa lectura ya no existe: alguien más la corrigió. Actualiza la lista.',
  'Nothing to correct': 'No cambiaste nada: elige otro sentido o escribe otra placa.',
  'direction must be ENTRY or EXIT': 'Elige entrada o salida.',
  'direction must be ENTRY, EXIT or AUTO': 'Elige entrada, salida o automático.',
  'licensePlateNumber must have 4 to 10 letters or digits':
    'La placa debe tener entre 4 y 10 letras o números.',
};

export function apiMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  return TRANSLATIONS[error.message] ?? error.message;
}
