import type { PickedFile } from '@/lib/picked-file';

export type DropZoneProps = {
  onFile: (file: PickedFile) => void;
  disabled?: boolean;
  /** Tipos aceptados por el selector, como en `<input accept>`. */
  accept: string;
  title: string;
  /** Formatos y límites, escritos para la persona. */
  hint: string;
};
