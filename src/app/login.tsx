import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand/logo';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Banner } from '@/components/ui/banner';
import { Button, LinkButton } from '@/components/ui/button';
import { LockIcon, MailIcon } from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field';
import { homeRouteFor } from '@/constants/navigation';
import { useSession } from '@/context/session';
import { apiMessage } from '@/lib/api-messages';
import { currentSurface, isSurfaceAllowed } from '@/lib/surface';
import { validateEmail } from '@/lib/validation';

/** El login existe en ambas plataformas: en web entra Portería a la consola de detección. */
export default function LoginScreen() {
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
      const signedIn = await signIn(email, password);
      router.replace(homeRouteFor(signedIn.role?.name));
    } catch (error) {
      setFormError(apiMessage(error, 'No pudimos iniciar sesión. Intenta de nuevo.'));
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

            {isSurfaceAllowed('mobile') ? (
              <LinkButton
                label="¿Olvidaste tu contraseña?"
                align="right"
                onPress={() => router.push('/forgot-password')}
              />
            ) : null}

            <Button label="Iniciar sesión" loading={submitting} onPress={() => void onSubmit()} />
          </View>
        </Card>

        {currentSurface === 'web' ? (
          <LinkButton
            label="¿Aún no tienes cuenta? Crear cuenta"
            onPress={() => router.push('/register')}
          />
        ) : (
          <Text className="text-center text-xs leading-5 text-steel-400">
            ¿Aún no tienes cuenta? El registro se hace desde el portal web de ENTRYX.
          </Text>
        )}
      </View>
    </AuthScreen>
  );
}
