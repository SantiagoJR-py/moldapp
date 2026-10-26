/**
 * Un archivo elegido por la persona: en web trae el `File` del navegador; en el celular,
 * solo la `uri` local que entiende `fetch` de React Native.
 */
export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  file?: File;
};

export function appendFile(form: FormData, field: string, picked: PickedFile): void {
  if (picked.file) {
    form.append(field, picked.file, picked.name);
    return;
  }
  // Forma que React Native acepta para subir un archivo local.
  form.append(field, {
    uri: picked.uri,
    name: picked.name,
    type: picked.mimeType,
  } as unknown as Blob);
}

export const MB = 1024 * 1024;
