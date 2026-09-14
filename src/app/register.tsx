import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand/logo';
import { SurfaceGate } from '@/components/surface-gate';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Banner } from '@/components/ui/banner';
import { Button, LinkButton } from '@/components/ui/button';
import { IdIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from '@/components/ui/icons';
import { PasswordMeter } from '@/components/ui/password-meter';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { IDENTIFICATION_TYPES } from '@/constants/identification-types';
import { catalogService } from '@/services/catalog.service';
import { apiMessage } from '@/lib/api-messages';
import {
  validateEmail,
  validateFullName,
  validateIdentification,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
} from '@/lib/validation';
import { authService } from '@/services/auth.service';

const FALLBACK_OPTIONS: SelectOption[] = IDENTIFICATION_TYPES.map((type) => ({
  value: type.id,
  label: type.name,
}));

type FieldErrors = {
  fullName?: string | null;
  email?: string | null;
  identification?: string | null;
  phone?: string | null;
  password?: string | null;
  confirmation?: string | null;
  identificationTypeId?: string | null;
};

export default function RegisterRoute() {
  return (
    <SurfaceGate only="web">
      <RegisterScreen />
    </SurfaceGate>
  );
}

function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [identification, setIdentification] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number | null>(null);
  const [options, setOptions] = useState(FALLBACK_OPTIONS);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void catalogService.identificationTypes().then((types) => {
      if (!active) return;

      setOptions(
        types.map((type) => ({ value: type.id, label: type.name ?? `Tipo ${type.id}` })),
      );
    });

    return () => {
      active = false;
    };
  }, []);

  function reset() {
    setFullName('');
    setEmail('');
    setIdentification('');
    setPhone('');
    setPassword('');
    setConfirmation('');
    setIdentificationTypeId(null);
    setErrors({});
    setCreated(false);
  }

  async function onSubmit() {
    const nextErrors: FieldErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      identification: validateIdentification(identification),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirmation: validatePasswordConfirmation(password, confirmation),
      identificationTypeId: identificationTypeId ? null : 'Selecciona un tipo de documento.',
    };

    setErrors(nextErrors);
    setFormError(null);

    if (Object.values(nextErrors).some(Boolean) || !identificationTypeId) return;

    setSubmitting(true);

    try {
      await authService.signUp({
        fullName,
        email,
        identification,
        phone,
        password,
        identificationTypeId,
      });
      setCreated(true);
    } catch (error) {
      setFormError(apiMessage(error, 'No pudimos crear la cuenta. Intenta de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <AuthScreen>
        <View className="gap-8">
          <BrandHeader />
          <Card>
            <View className="gap-5">
              <Banner tone="success" message="Tu cuenta quedó creada correctamente." />
              <Text className="text-sm leading-5 text-steel-400">
                Ya puedes iniciar sesión desde la aplicación móvil de MoldApp con el correo{' '}
                <Text className="text-steel-200">{email.trim().toLowerCase()}</Text>.
              </Text>
              <LinkButton label="Registrar otra cuenta" onPress={reset} />
            </View>
          </Card>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <View className="gap-8">
        <BrandHeader tagline="Crea tu cuenta para empezar" />

        <Card>
          <View className="gap-5">
            {formError ? <Banner tone="error" message={formError} /> : null}

            <TextField
              label="Nombre completo"
              placeholder="Nombre y apellido"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              icon={<UserIcon />}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />

            <SelectField
              label="Tipo de documento"
              placeholder="Selecciona una opción"
              options={options}
              value={identificationTypeId}
              onChange={setIdentificationTypeId}
              error={errors.identificationTypeId}
              icon={<IdIcon />}
            />

            <TextField
              label="Número de documento"
              placeholder="Sin puntos ni espacios"
              value={identification}
              onChangeText={setIdentification}
              error={errors.identification}
              hint="No podrás cambiarlo después: verifica que esté bien."
              icon={<IdIcon />}
              keyboardType="number-pad"
              autoCapitalize="characters"
              inputMode="numeric"
            />

            <TextField
              label="Teléfono"
              placeholder="3001234567"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              icon={<PhoneIcon />}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              inputMode="tel"
            />

            <TextField
              label="Correo"
              placeholder="tucorreo@dominio.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon={<MailIcon />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
            />

            <View className="gap-3">
              <TextField
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                icon={<LockIcon />}
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <PasswordMeter password={password} />
            </View>

            <TextField
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              value={confirmation}
              onChangeText={setConfirmation}
              error={errors.confirmation}
              icon={<LockIcon />}
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={() => void onSubmit()}
            />

            <Button label="Crear cuenta" loading={submitting} onPress={() => void onSubmit()} />
          </View>
        </Card>

        <Text className="text-center text-xs leading-5 text-steel-500">
          El inicio de sesión y la recuperación de contraseña están disponibles en la app móvil.
        </Text>
      </View>
    </AuthScreen>
  );
}
