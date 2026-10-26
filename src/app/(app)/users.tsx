import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminOnly } from '@/components/admin-only';
import { Avatar } from '@/components/app/avatar';
import { plateCard } from '@/components/plates/styles';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronDownIcon, UsersIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { RoleName, roleLabel, type RoleNameValue } from '@/constants/roles';
import { palette, radius } from '@/constants/theme';
import { useSession } from '@/context/session';
import { apiMessage } from '@/lib/api-messages';
import { appear, settle } from '@/lib/motion';
import { adminService, type AdminUser } from '@/services/admin.service';

/** Se busca cuando se deja de escribir, no con cada letra. */
const SEARCH_DELAY_MS = 300;
/** El mismo tope del backend: con más resultados hay que afinar la búsqueda. */
const LIST_LIMIT = 50;

/** Portería primero: es el cambio que más se hace (las cuentas nuevas llegan como Estudiante). */
const ROLE_ORDER: RoleNameValue[] = [
  RoleName.WARDEN,
  RoleName.ADMINISTRATIVE_STAFF,
  RoleName.STUDENT,
  RoleName.TEACHER,
  RoleName.STAFF,
  RoleName.EXTERNAL_PERSONS,
];

/** En el chip de cada fila no caben los nombres largos: ahí van cortos. */
const SHORT_ROLE_LABEL: Partial<Record<string, string>> = {
  [RoleName.ADMINISTRATIVE_STAFF]: 'Administración',
  [RoleName.EXTERNAL_PERSONS]: 'Externo',
};

/** Los roles que abren la consola de portería se distinguen del resto de un vistazo. */
const GATE_ROLES: string[] = [RoleName.WARDEN, RoleName.ADMINISTRATIVE_STAFF];

export default function UsersRoute() {
  return (
    <AdminOnly>
      <UsersScreen />
    </AdminOnly>
  );
}

type Feedback = { tone: 'success' | 'error'; message: string };

function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { user: me } = useSession();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      try {
        const found = await adminService.users(search);
        // Si se siguió escribiendo, esta respuesta ya no es la que se está esperando.
        if (ticket !== latest.current) return;
        setUsers(found);
        setError(null);
      } catch (caught) {
        if (ticket !== latest.current) return;
        setError(apiMessage(caught, 'No pudimos cargar las cuentas.'));
      }
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [search]);

  function saved(updated: AdminUser) {
    setUsers((list) => list?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
    setOpenId(null);
    setFeedback({
      tone: 'success',
      message: `${updated.fullName} ahora es ${roleLabel(updated.role?.name)}. Lo verá al volver a abrir la app.`,
    });
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Animated.View entering={appear} style={{ gap: 8 }}>
        <Text className="text-3xl font-bold tracking-tight text-steel-100">Usuarios</Text>
        <Text className="text-sm leading-5 text-steel-300">
          Las cuentas nuevas empiezan como Estudiante. Para que alguien vea las cámaras y las
          alertas, dale el rol Portería.
        </Text>
      </Animated.View>

      <TextField
        label="Buscar una cuenta"
        placeholder="Nombre, correo o documento"
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setFeedback(null);
        }}
        icon={<UsersIcon size={18} color={palette.steel300} />}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {feedback ? <Banner tone={feedback.tone} message={feedback.message} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <Animated.View
        layout={settle}
        style={[plateCard, { paddingHorizontal: 16, paddingVertical: 4 }]}
      >
        {users === null ? (
          <Text className="py-4 text-sm text-steel-300">Buscando…</Text>
        ) : users.length === 0 ? (
          <Text className="py-4 text-sm text-steel-300">
            {search.trim()
              ? `Ninguna cuenta coincide con “${search.trim()}”.`
              : 'Todavía no hay cuentas.'}
          </Text>
        ) : (
          users.map((item, index) => (
            <UserRow
              key={item.id}
              user={item}
              first={index === 0}
              self={item.id === me?.id}
              open={openId === item.id}
              onToggle={() => {
                setFeedback(null);
                setOpenId((current) => (current === item.id ? null : item.id));
              }}
              onSaved={saved}
              onError={(message) => setFeedback({ tone: 'error', message })}
            />
          ))
        )}
      </Animated.View>

      {users && users.length >= LIST_LIMIT ? (
        <Text className="text-xs leading-4 text-steel-400">
          Se muestran las primeras {LIST_LIMIT}. Escribe el nombre o el documento para encontrar a
          alguien más.
        </Text>
      ) : null}
    </ScrollView>
  );
}

type UserRowProps = {
  user: AdminUser;
  first: boolean;
  self: boolean;
  open: boolean;
  onToggle: () => void;
  onSaved: (user: AdminUser) => void;
  onError: (message: string) => void;
};

function UserRow({ user, first, self, open, onToggle, onSaved, onError }: UserRowProps) {
  const current = (user.role?.name ?? RoleName.STUDENT) as RoleNameValue;
  const detail = [
    user.identification
      ? `${user.identificationType?.name ?? 'Documento'} ${user.identification}`
      : null,
    user.email,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={first ? null : { borderTopWidth: 1, borderTopColor: palette.hairline }}>
      <PressableScale
        accessibilityLabel={
          self
            ? `${user.fullName}, tu cuenta, ${roleLabel(current)}`
            : `${user.fullName}, ${roleLabel(current)}. Cambiar rol`
        }
        accessibilityState={{ expanded: open }}
        disabled={self}
        depth={0.99}
        onPress={onToggle}
        style={{
          minHeight: 64,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
        }}
      >
        <Avatar fullName={user.fullName} urlImage={user.urlImage} size={40} />
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] text-steel-100" numberOfLines={1}>
            {user.fullName}
            {self ? <Text className="text-steel-400">{'  ·  Tú'}</Text> : null}
          </Text>
          {detail ? (
            <Text className="text-xs text-steel-400" numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>
        <RoleChip roleName={current} />
        {self ? null : (
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <ChevronDownIcon size={16} color={palette.steel400} />
          </View>
        )}
      </PressableScale>

      {/* Se monta de nuevo cada vez que se abre: siempre parte del rol que la cuenta tiene ahora. */}
      {open ? (
        <RolePicker
          user={user}
          current={current}
          onCancel={onToggle}
          onSaved={onSaved}
          onError={onError}
        />
      ) : null}
    </View>
  );
}

type RolePickerProps = {
  user: AdminUser;
  current: RoleNameValue;
  onCancel: () => void;
  onSaved: (user: AdminUser) => void;
  onError: (message: string) => void;
};

function RolePicker({ user, current, onCancel, onSaved, onError }: RolePickerProps) {
  const [choice, setChoice] = useState<RoleNameValue>(current);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      onSaved(await adminService.changeRole(user.id, choice));
    } catch (caught) {
      onError(apiMessage(caught, 'No pudimos cambiar el rol.'));
      setSaving(false);
    }
  }

  return (
    <Animated.View entering={appear} style={{ gap: 14, paddingBottom: 16 }}>
      <Text className="text-[13px] font-medium text-steel-300">Rol de {user.fullName}</Text>
      <View
        accessibilityRole="radiogroup"
        style={{
          overflow: 'hidden',
          borderRadius: radius.field,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: palette.ink600,
          backgroundColor: palette.ink900,
        }}
      >
        {ROLE_ORDER.map((roleName, index) => {
          const selected = choice === roleName;
          return (
            <PressableScale
              key={roleName}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={roleLabel(roleName)}
              depth={0.99}
              onPress={() => setChoice(roleName)}
              style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                backgroundColor: selected ? 'rgba(47, 128, 237, 0.16)' : 'transparent',
                ...(index > 0 ? { borderTopWidth: 1, borderTopColor: palette.hairline } : null),
              }}
            >
              <Text
                className={`flex-1 text-[15px] ${selected ? 'font-medium text-accent-200' : 'text-steel-200'}`}
              >
                {roleLabel(roleName)}
                {roleName === current ? (
                  <Text className="text-xs text-steel-400">{'  ·  actual'}</Text>
                ) : null}
              </Text>
              {selected ? <CheckIcon size={18} color={palette.accent300} /> : null}
            </PressableScale>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={choice === current ? 'Elige otro rol' : `Cambiar a ${roleLabel(choice)}`}
            loading={saving}
            disabled={choice === current}
            onPress={() => void save()}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Cancelar" variant="outline" disabled={saving} onPress={onCancel} />
        </View>
      </View>
    </Animated.View>
  );
}

function RoleChip({ roleName }: { roleName: string }) {
  const gate = GATE_ROLES.includes(roleName);
  return (
    <View
      style={{
        borderRadius: radius.pill,
        backgroundColor: gate ? 'rgba(47, 128, 237, 0.16)' : palette.ink700,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text
        className={`text-xs font-medium ${gate ? 'text-accent-200' : 'text-steel-200'}`}
        numberOfLines={1}
      >
        {SHORT_ROLE_LABEL[roleName] ?? roleLabel(roleName)}
      </Text>
    </View>
  );
}
