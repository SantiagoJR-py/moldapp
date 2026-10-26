import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Isotype } from '@/components/brand/logo';
import { SurfaceGate } from '@/components/surface-gate';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Banner } from '@/components/ui/banner';
import { Button, LinkButton } from '@/components/ui/button';
import { ArrowLeftIcon, MailIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/theme';
import { apiMessage } from '@/lib/api-messages';
import { ApiError } from '@/lib/http';
import { authService } from '@/services/auth.service';
import { validateEmail } from '@/lib/validation';

export default function ForgotPasswordRoute() {
  return (
    <SurfaceGate only="mobile">
      <ForgotPasswordScreen />
    </SurfaceGate>
  );
}

function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/login');
  }

  async function onSubmit() {
    const error = validateEmail(email);
    setEmailError(error);
    setFormError(null);

    if (error) return;

    setSubmitting(true);

    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 404
          ? 'No encontramos una cuenta con ese correo.'
          : apiMessage(error, 'No pudimos enviar el correo. Intenta de nuevo.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen>
      <View className="gap-8">
        <View className="gap-6">
          <PressableScale
            accessibilityLabel="Volver"
            depth={0.88}
            onPress={goBack}
            style={{
              height: 42,
              width: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 21,
              borderWidth: 1,
              borderColor: palette.ink600,
              backgroundColor: palette.ink700,
            }}
          >
            <ArrowLeftIcon size={18} color={palette.steel200} />
          </PressableScale>

          <View className="gap-3">
            <Isotype size={46} />
            <Text className="text-2xl font-bold tracking-tight text-steel-100">
              Recupera tu contraseña
            </Text>
            <Text className="text-sm leading-5 text-steel-300">
              Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña
              nueva.
            </Text>
          </View>
        </View>

        {sent ? (
          <Card>
            <View className="gap-5">
              <Banner
                tone="success"
                message={`Enviamos un enlace a ${email.trim().toLowerCase()}. Ábrelo en tu navegador para cambiar la contraseña.`}
              />
              <Text className="text-xs leading-5 text-steel-400">
                El enlace es de un solo uso. Si no lo ves en unos minutos, revisa la carpeta de
                spam.
              </Text>
              <Button label="Volver a iniciar sesión" onPress={() => router.replace('/login')} />
              <LinkButton
                label="Usar otro correo"
                onPress={() => {
                  setSent(false);
                  setEmail('');
                }}
              />
            </View>
          </Card>
        ) : (
          <Card>
            <View className="gap-5">
              {formError ? <Banner tone="error" message={formError} /> : null}

              <TextField
                label="Correo"
                placeholder="tucorreo@dominio.com"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                icon={<MailIcon />}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                inputMode="email"
                returnKeyType="send"
                onSubmitEditing={() => void onSubmit()}
              />

              <Button label="Enviar enlace" loading={submitting} onPress={() => void onSubmit()} />
              <LinkButton
                label="Volver a iniciar sesión"
                onPress={() => router.replace('/login')}
              />
            </View>
          </Card>
        )}
      </View>
    </AuthScreen>
  );
}
