import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/app/avatar';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  CameraIcon,
  IdIcon,
  LogoutIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
  UserIcon,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { roleLabel } from '@/constants/roles';
import { palette, radius, shadows, surface } from '@/constants/theme';
import { useSession } from '@/context/session';
import { apiMessage } from '@/lib/api-messages';
import { entryRoute } from '@/lib/surface';
import { validateEmail, validateFullName, validatePhone } from '@/lib/validation';
import { profileService } from '@/services/profile.service';
import { appear } from '@/lib/motion';

/** Tarjeta de seccion. Se repite dos veces en esta pantalla. */
const sectionCard = { ...surface, gap: 20, padding: 20 } as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, signOut } = useSession();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<{
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  }>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const dirty =
    fullName.trim() !== user.fullName ||
    email.trim().toLowerCase() !== (user.email ?? '') ||
    phone.trim() !== (user.phone ?? '');

  async function onSave() {
    if (!user) return;

    const nextErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      phone: validatePhone(phone),
    };

    setErrors(nextErrors);
    setFeedback(null);

    if (nextErrors.fullName || nextErrors.email || nextErrors.phone) return;

    setSaving(true);

    try {
      const updated = await profileService.update({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });

      await setUser(updated);
      setFeedback({ tone: 'success', message: 'Datos actualizados.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: apiMessage(error, 'No pudimos guardar los cambios.') });
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
      setFeedback({ tone: 'error', message: apiMessage(error, 'No pudimos subir la foto.') });
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 22 }}
    >
      <Animated.View entering={appear} style={{ alignItems: 'center', gap: 12 }}>
        <View>
          <Avatar fullName={user.fullName} urlImage={user.urlImage} size={104} />

          <PressableScale
            accessibilityLabel="Cambiar foto de perfil"
            disabled={uploading}
            depth={0.9}
            onPress={() => void onPickPhoto()}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              borderWidth: 2,
              borderColor: palette.ink950,
              backgroundColor: palette.accent600,
              boxShadow: shadows.accent,
            }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <CameraIcon size={17} color={palette.white} />
            )}
          </PressableScale>
        </View>

        <Text className="mt-1 text-center text-xl font-semibold text-steel-100">
          {user.fullName}
        </Text>
        <View className="self-center rounded-pill border border-accent-500/40 bg-accent-500/10 px-3 py-1">
          <Text className="text-xs font-medium text-accent-300">{roleLabel(user.role?.name)}</Text>
        </View>
      </Animated.View>

      {feedback ? <Banner tone={feedback.tone} message={feedback.message} /> : null}

      <Animated.View entering={appear} style={sectionCard}>
        <Text className="text-base font-semibold text-steel-100">Datos que puedes editar</Text>

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

        <TextField
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          icon={<PhoneIcon />}
          keyboardType="phone-pad"
          inputMode="tel"
        />

        <Button
          label="Guardar cambios"
          loading={saving}
          disabled={!dirty}
          onPress={() => void onSave()}
        />
      </Animated.View>

      <Animated.View entering={appear} style={[sectionCard, { gap: 4 }]}>
        <Text className="pb-2 text-base font-semibold text-steel-100">
          Datos administrados por la institución
        </Text>

        <ReadOnlyRow
          first
          icon={<IdIcon size={18} />}
          label="Documento"
          value={
            user.identification
              ? `${user.identificationType?.name ?? 'Documento'} ${user.identification}`
              : (user.identificationType?.name ?? 'Sin registrar')
          }
        />
        <ReadOnlyRow icon={<UserIcon size={18} />} label="Rol" value={roleLabel(user.role?.name)} />
        <ReadOnlyRow
          icon={<ShieldIcon size={18} />}
          label="Estado"
          value={user.state === 'ENABLED' ? 'Activo' : 'Inactivo'}
        />

        <Text className="pt-2 text-xs leading-5 text-steel-400">
          Para corregir estos datos escribe al área administrativa.
        </Text>
      </Animated.View>

      {/* En el celular no hay menú lateral: cerrar sesión vive aquí. */}
      <Animated.View entering={appear}>
        <PressableScale
          accessibilityLabel="Cerrar sesión"
          onPress={() => void signOut().then(() => router.replace(entryRoute))}
          style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderRadius: radius.field,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: 'rgba(251, 113, 133, 0.38)',
            backgroundColor: 'rgba(251, 113, 133, 0.08)',
          }}
        >
          <LogoutIcon size={19} color={palette.danger} />
          <Text className="text-base font-semibold text-state-danger">Cerrar sesión</Text>
        </PressableScale>
      </Animated.View>
    </ScrollView>
  );
}

/** Fila de lista, como en Ajustes: etiqueta a la izquierda, valor a la derecha, sin recuadro propio. */
function ReadOnlyRow({
  icon,
  label,
  value,
  first = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <View
      style={{
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        ...(first ? null : { borderTopWidth: 1, borderTopColor: palette.hairline }),
      }}
    >
      {icon}
      <Text className="text-sm text-steel-300">{label}</Text>
      <Text className="flex-1 text-right text-sm text-steel-100" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
