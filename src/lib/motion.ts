import { Platform } from 'react-native';
import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { motion } from '@/constants/theme';

/**
 * En el celular el contenido aparece quieto: sin caídas, resortes ni cascadas que lo hagan
 * saltar, y las listas que se refrescan solas no rebotan al llegar una fila. En la web queda
 * un fundido corto, sin desplazamiento.
 */
export const stillMotion = Platform.OS !== 'web';

/** Entrada de contenido dentro de una pantalla: tarjetas, filas nuevas, paneles que se abren. */
export const appear = stillMotion ? undefined : FadeIn.duration(motion.base);

/** Salida de contenido que se quita de una lista o un panel. */
export const vanish = stillMotion ? undefined : FadeOut.duration(motion.fast);

/** Reacomodo de las filas vecinas cuando llega o se va una. */
export const settle = stillMotion ? undefined : LinearTransition.duration(motion.base);

/**
 * Superposiciones (modales, menús, avisos sobre la cámara): un fundido corto en todas las
 * plataformas. No empujan nada, así que no se sienten como un salto.
 */
export const overlayIn = FadeIn.duration(motion.fast);
export const overlayOut = FadeOut.duration(motion.fast);
