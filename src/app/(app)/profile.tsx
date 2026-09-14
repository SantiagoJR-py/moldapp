import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/app/avatar';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CameraIcon, IdIcon, MailIcon, UserIcon } from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field';
import { roleLabel } from '@/constants/roles';
import { palette } from '@/constants/theme';
import { useSession } from '@/context/session';
import { ApiError } from '@/lib/http';
import { validateEmail, validateFullName } from '@/lib/validation';
import { profileService } from '@/services/profile.service';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useSession();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ fullName?: string | null; email?: string | null }>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const dirty = fullName.trim() !== user.fullName || email.trim().toLowerCase() !== (user.email ?? '');

  async function onSave() {
    if (!user) return;

    const nextErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
    };

    setErrors(nextErrors);
    setFeedback(null);

    if (nextErrors.fullName || nextErrors.email) return;

    setSaving(true);

    try {
      const updated = await profileService.update({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      });

      await setUser(updated);
      setFeedback({ tone: 'success', message: 'Datos actualizados.' });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof ApiError ? error.message : 'No pudimos guardar los cambios.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function onPickPhoto() {
    setFeedback(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFeedback({
        tone: 'error',
        message: 'Necesitamos permiso a tus fotos para cambiar la imagen.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    setUploading(true);

    try {
      const updated = await profileService.uploadPhoto({
        uri: asset.uri,
        name: asset.fileName ?? 'foto.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });

      await setUser(updated);
      setFeedback({ tone: 'success', message: 'Foto actualizada.' });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'No pudimos subir la foto.',
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 20 }}
    >
      <View className="items-center gap-3">
        <View>
          <Avatar fullName={user.fullName} urlImage={user.urlImage} size={96} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
            disabled={uploading}
            onPress={() => void onPickPhoto()}
            className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-ink-950 bg-accent-600 active:opacity-80"
          >
            {uploading ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <CameraIcon size={17} color={palette.white} />
            )}
          </Pressable>
        </View>

        <Text className="text-lg font-semibold text-white">{user.fullName}</Text>
        <View className="rounded-full border border-accent-500/40 bg-accent-500/10 px-3 py-1">
          <Text className="text-xs text-accent-300">{roleLabel(user.role?.name)}</Text>
        </View>
      </View>

      {feedback ? <Banner tone={feedback.tone} message={feedback.message} /> : null}

      <View className="gap-5 rounded-card border border-ink-600 bg-ink-900 p-5">
        <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
          Datos que puedes editar
        </Text>

        <TextField
          label="Nombre completo"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          icon={<UserIcon />}
          autoCapitalize="words"
        />

        <TextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          icon={<MailIcon />}
          keyboardType="email-address"
          autoCapitalize="none"
          inputMode="email"
        />

        <Button
          label="Guardar cambios"
          loading={saving}
          disabled={!dirty}
          onPress={() => void onSave()}
        />
      </View>

      <View className="gap-4 rounded-card border border-ink-600 bg-ink-900 p-5">
        <Text className="text-xs font-medium uppercase tracking-wider text-steel-500">
          Datos administrados por la institución
        </Text>

        <ReadOnlyRow
          icon={<IdIcon size={18} />}
          label="Tipo de documento"
          value={user.identificationType?.name ?? `#${user.identificationTypeId}`}
        />
        <ReadOnlyRow icon={<UserIcon size={18} />} label="Rol" value={roleLabel(user.role?.name)} />
        <ReadOnlyRow
          icon={<UserIcon size={18} />}
          label="Estado"
          value={user.state === 'ENABLED' ? 'Activo' : 'Inactivo'}
        />

        <Text className="text-xs leading-5 text-steel-500">
          Para corregir estos datos escribe al área administrativa.
        </Text>
      </View>
    </ScrollView>
  );
}

function ReadOnlyRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-field border border-ink-700 bg-ink-800 px-4 py-3">
      {icon}
      <View className="flex-1">
        <Text className="text-[11px] uppercase tracking-wider text-steel-500">{label}</Text>
        <Text className="mt-0.5 text-sm text-steel-200">{value}</Text>
      </View>
    </View>
  );
}
