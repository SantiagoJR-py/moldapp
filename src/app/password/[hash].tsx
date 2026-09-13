import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand/logo';
import { SurfaceGate } from '@/components/surface-gate';
import { AuthScreen, Card } from '@/components/ui/auth-screen';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { LockIcon } from '@/components/ui/icons';
import { PasswordMeter } from '@/components/ui/password-meter';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/theme';
import { ApiError } from '@/lib/http';
import { validatePassword, validatePasswordConfirmation } from '@/lib/validation';
import { authService } from '@/services/auth.service';

/**
 * Destino del enlace que arma el backend: `${HOST_FRONT}/password/${hash}`.
 * El hash se valida contra `users.hash`; si no coincide, el backend registra el
 * intento (IP y datos del cliente) en `sessions`.
 */
export default function ChangePasswordRoute() {
  return (
    <SurfaceGate only="web">
      <ChangePasswordScreen />
    </SurfaceGate>
  );
}

type Status = 'verifying' | 'invalid' | 'ready' | 'done';

function ChangePasswordScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();

  const [status, setStatus] = useState<Status>('verifying');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<{ password?: string | null; confirmation?: string | null }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!hash) {
        setStatus('invalid');
        return;
      }

      try {
        await authService.verifyHash(hash);
        if (active) setStatus('ready');
      } catch {
        if (active) setStatus('invalid');
      }
    })();

    return () => {
      active = false;
    };
  }, [hash]);

  const onSubmit = useCallback(async () => {
    const nextErrors = {
      password: validatePassword(password),
      confirmation: validatePasswordConfirmation(password, confirmation),
    };

    setErrors(nextErrors);
    setFormError(null);

    if (nextErrors.password || nextErrors.confirmation) return;

    setSubmitting(true);

    try {
      await authService.changePassword(hash, password);
      setStatus('done');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setStatus('invalid');
        return;
      }

      setFormError(
        error instanceof ApiError
          ? error.message
          : 'No pudimos cambiar la contraseña. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [confirmation, hash, password]);

  return (
    <AuthScreen>
      <View className="gap-8">
        <BrandHeader tagline="Define una contraseña nueva" />

        {status === 'verifying' ? (
          <Card>
            <View className="items-center gap-4 py-6">
              <ActivityIndicator color={palette.accent400} />
              <Text className="text-sm text-steel-400">Validando el enlace…</Text>
            </View>
          </Card>
        ) : null}

        {status === 'invalid' ? (
          <Card>
            <View className="gap-5">
              <Banner
                tone="error"
                message="Este enlace no es válido o ya fue utilizado."
              />
              <Text className="text-sm leading-5 text-steel-400">
                Por seguridad registramos el intento junto con la dirección IP desde la que se
                abrió. Si fuiste tú, solicita un enlace nuevo desde la app móvil, en
                <Text className="text-steel-200"> ¿Olvidaste tu contraseña?</Text>
              </Text>
            </View>
          </Card>
        ) : null}

        {status === 'ready' ? (
          <Card>
            <View className="gap-5">
              {formError ? <Banner tone="error" message={formError} /> : null}

              <View className="gap-3">
                <TextField
                  label="Nueva contraseña"
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

              <Button
                label="Guardar contraseña"
                loading={submitting}
                onPress={() => void onSubmit()}
              />
            </View>
          </Card>
        ) : null}

        {status === 'done' ? (
          <Card>
            <View className="gap-5">
              <Banner tone="success" message="Tu contraseña quedó actualizada." />
              <Text className="text-sm leading-5 text-steel-400">
                Ya puedes iniciar sesión en la app móvil de MoldApp con tu contraseña nueva.
              </Text>
            </View>
          </Card>
        ) : null}
      </View>
    </AuthScreen>
  );
}
