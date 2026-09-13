import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand/logo';
import { SurfaceGate } from '@/components/surface-gate';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Banner } from '@/components/ui/banner';
import { Button, LinkButton } from '@/components/ui/button';
import { LockIcon, MailIcon } from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field';
import { useSession } from '@/context/session';
import { ApiError } from '@/lib/http';
import { validateEmail } from '@/lib/validation';

export default function LoginRoute() {
  return (
    <SurfaceGate only="mobile">
      <LoginScreen />
    </SurfaceGate>
  );
}

function LoginScreen() {
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const emailError = validateEmail(email);
    const passwordError = password ? null : 'La contraseña es obligatoria.';

    setErrors({ email: emailError, password: passwordError });
    setFormError(null);

    if (emailError || passwordError) return;

    setSubmitting(true);

    try {
      await signIn(email, password);
      router.replace('/home');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'No pudimos iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen>
      <View className="gap-8">
        <BrandHeader tagline="Entra con tu cuenta para continuar" />

        <Card>
          <View className="gap-5">
            {formError ? <Banner tone="error" message={formError} /> : null}

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
              returnKeyType="next"
            />

            <TextField
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              icon={<LockIcon />}
              secure
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void onSubmit()}
            />

            <LinkButton
              label="¿Olvidaste tu contraseña?"
              align="right"
              onPress={() => router.push('/forgot-password')}
            />

            <Button label="Iniciar sesión" loading={submitting} onPress={() => void onSubmit()} />
          </View>
        </Card>

        <Text className="text-center text-xs leading-5 text-steel-500">
          ¿Aún no tienes cuenta? El registro se hace desde el portal web de MoldApp.
        </Text>
      </View>
    </AuthScreen>
  );
}
