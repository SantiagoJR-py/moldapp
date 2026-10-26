import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Banner } from '@/components/ui/banner';
import { IdIcon, PencilIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { palette, radius } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { clockTime } from '@/lib/time';
import { gateService } from '@/services/gate.service';
import type { PlateDirection, PlateRead } from '@/services/plate-read.service';
import { appear, vanish } from '@/lib/motion';

/** Los motivos que más se repiten al corregir: un toque en vez de escribir. */
const QUICK_REASONS = ['Sentido equivocado', 'Placa mal leída', 'Vehículo de prueba'];

const DIRECTION_LABEL: Record<PlateDirection, string> = { ENTRY: 'Entrada', EXIT: 'Salida' };

/** Qué decía la lectura antes de corregirla, quién la corrigió y por qué. */
export function CorrectionNote({ read }: { read: PlateRead }) {
  if (!read.corrects) return null;

  const previous = read.corrects;
  const changes = [
    previous.licensePlateNumber !== read.licensePlateNumber
      ? `placa ${previous.licensePlateNumber} → ${read.licensePlateNumber}`
      : null,
    previous.direction !== read.direction
      ? `${DIRECTION_LABEL[previous.direction]} → ${DIRECTION_LABEL[read.direction]}`
      : null,
  ].filter(Boolean);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        borderRadius: radius.field,
        borderCurve: 'continuous',
        backgroundColor: palette.ink700,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View className="mt-0.5">
        <PencilIcon size={15} color={palette.steel300} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-xs font-semibold text-steel-200">
          Corregida{read.creator ? ` por ${read.creator.fullName}` : ''}
          {changes.length ? `: ${changes.join(' · ')}` : ''}
        </Text>
        {read.correctionNote ? (
          <Text className="text-xs leading-4 text-steel-300">
            &quot;{read.correctionNote}&quot;
          </Text>
        ) : null}
        <Text className="text-[11px] text-steel-400">
          La lectura original se conserva en el historial (no se borra).
        </Text>
      </View>
    </View>
  );
}

type CorrectionEditorProps = {
  read: PlateRead;
  onCancel: () => void;
  /** La original queda con soft delete; esta es la que la reemplaza. */
  onSaved: (replacedId: number, read: PlateRead) => void;
};

/** Corregir el sentido o la placa de una lectura, siempre con un motivo. */
export function CorrectionEditor({ read, onCancel, onSaved }: CorrectionEditorProps) {
  const [direction, setDirection] = useState<PlateDirection>(read.direction);
  const [plate, setPlate] = useState(read.licensePlateNumber);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const changed = direction !== read.direction || cleanPlate !== read.licensePlateNumber;

  async function save() {
    if (!changed) {
      setError('No cambiaste nada: elige otro sentido o escribe otra placa.');
      return;
    }
    if (cleanPlate.length < 4) {
      setError('La placa debe tener entre 4 y 10 letras o números.');
      return;
    }
    if (note.trim().length < 3) {
      setError('Escribe por qué la corriges: queda en el historial.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const corrected = await gateService.correctRead(read.id, {
        ...(direction !== read.direction ? { direction } : {}),
        ...(cleanPlate !== read.licensePlateNumber ? { licensePlateNumber: cleanPlate } : {}),
        note: note.trim(),
      });
      onSaved(read.id, corrected);
    } catch (caught) {
      setError(apiMessage(caught, 'No pudimos corregir la lectura.'));
      setSaving(false);
    }
  }

  return (
    <Animated.View
      entering={appear}
      exiting={vanish}
      style={{
        gap: 14,
        borderRadius: radius.field,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.ink600,
        backgroundColor: palette.ink700,
        padding: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text className="text-sm font-semibold text-steel-100">
          Corregir lectura de las {clockTime(new Date(read.seenAt).getTime())}
        </Text>
        <Text className="text-xs leading-4 text-steel-300">
          La original no se borra: queda guardada y se ve quién la corrigió.
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text className="text-[13px] font-medium text-steel-300">Sentido</Text>
        <Segmented
          accessibilityLabel="Sentido de la lectura"
          value={direction}
          onChange={setDirection}
          segments={[
            { value: 'ENTRY', label: 'Entrada' },
            { value: 'EXIT', label: 'Salida' },
          ]}
        />
      </View>

      <TextField
        label="Placa"
        value={plate}
        onChangeText={(value) => setPlate(value.toUpperCase())}
        icon={<IdIcon />}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={10}
      />

      <View style={{ gap: 8 }}>
        <TextField
          label="Motivo"
          value={note}
          onChangeText={setNote}
          placeholder="Ej.: la cámara la tomó como entrada"
          maxLength={200}
        />
        <View className="flex-row flex-wrap gap-2">
          {QUICK_REASONS.map((reason) => {
            const selected = note === reason;
            return (
              <PressableScale
                key={reason}
                accessibilityLabel={`Motivo: ${reason}`}
                depth={0.94}
                onPress={() => setNote(reason)}
                style={{
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: selected ? palette.accent400 : palette.ink600,
                  backgroundColor: selected ? 'rgba(47, 128, 237, 0.18)' : palette.ink900,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text
                  className={`text-sm ${selected ? 'font-medium text-accent-200' : 'text-steel-200'}`}
                >
                  {reason}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      {error ? <Banner tone="error" message={error} /> : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1.4 }}>
          <PressableScale
            accessibilityLabel="Guardar corrección"
            disabled={saving}
            onPress={() => void save()}
            style={{
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.field,
              borderCurve: 'continuous',
              backgroundColor: palette.accent600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: palette.white, fontSize: 15, fontWeight: '600' }}>
              {saving ? 'Guardando…' : 'Guardar corrección'}
            </Text>
          </PressableScale>
        </View>
        <View style={{ flex: 1 }}>
          <PressableScale
            accessibilityLabel="Cancelar corrección"
            disabled={saving}
            onPress={onCancel}
            style={{
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.field,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: palette.ink600,
              backgroundColor: palette.ink900,
            }}
          >
            <Text className="text-sm font-medium text-steel-200">Cancelar</Text>
          </PressableScale>
        </View>
      </View>
    </Animated.View>
  );
}
