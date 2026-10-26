import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Text, View } from 'react-native';

import { UploadIcon } from '@/components/ui/icons';
import { motion, palette, radius } from '@/constants/theme';
import type { PickedFile } from '@/lib/picked-file';
import type { DropZoneProps } from './drop-zone.types';

function toPicked(file: File): PickedFile {
  return {
    uri: URL.createObjectURL(file),
    name: file.name,
    mimeType: file.type,
    size: file.size,
    file,
  };
}

/**
 * Zona para soltar una foto o un video. En web se puede arrastrar el archivo encima,
 * hacer clic o usar el teclado (Enter / Espacio) para abrir el selector.
 */
export function DropZone({ onFile, disabled = false, accept, title, hint }: DropZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(files: FileList | null) {
    const file = files?.[0];
    if (file && !disabled) onFile(toPicked(file));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.current?.click();
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={title}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={onKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      style={{
        cursor: disabled ? 'progress' : 'pointer',
        outline: 'none',
        borderRadius: radius.card,
        border: `1.5px ${over ? 'solid' : 'dashed'} ${over ? palette.accent400 : palette.ink600}`,
        background: over ? 'rgba(61, 143, 245, 0.08)' : palette.ink800,
        opacity: disabled ? 0.6 : 1,
        transition: `border-color ${motion.fast}ms ease-out, background ${motion.fast}ms ease-out`,
        padding: '40px 24px',
      }}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          take(event.target.files);
          event.target.value = '';
        }}
      />
      <View className="items-center gap-3">
        <View
          style={{
            height: 52,
            width: 52,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.field,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(47, 128, 237, 0.14)',
          }}
        >
          <UploadIcon size={24} color={palette.accent400} />
        </View>
        <Text className="text-center text-lg font-semibold text-steel-100">
          {over ? 'Suelta el archivo para analizarlo' : title}
        </Text>
        <Text className="text-center text-sm text-accent-400">
          o haz clic para elegir un archivo
        </Text>
        <Text className="text-center text-xs leading-5 text-steel-400">{hint}</Text>
      </View>
    </div>
  );
}
