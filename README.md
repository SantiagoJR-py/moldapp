# MoldApp — Front

Aplicación universal (móvil + web) construida con **Expo SDK 57 / React Native 0.86**,
**Expo Router** y **NativeWind (Tailwind CSS)**. Consume el API de
[`moldapp-back`](../moldapp-back).

## Reparto de pantallas

La app corre con un solo código base, pero cada pantalla vive en una plataforma:

| Pantalla                       | Ruta                | Plataforma |
| ------------------------------ | ------------------- | ---------- |
| Inicio de sesión               | `/login`            | Móvil      |
| Recuperación de contraseña     | `/forgot-password`  | Móvil      |
| Registro                       | `/register`         | Web        |
| Cambio de contraseña por hash  | `/password/:hash`   | Web        |

Ya autenticado, las pantallas viven bajo **`/admin`** (guard de sesión + shell
con menú lateral y barra superior):

| Pantalla       | Ruta              |
| -------------- | ----------------- |
| Inicio         | `/admin/home`     |
| Mi perfil      | `/admin/profile`  |
| Mis vehículos  | `/admin/vehicles` |

Los guards (`AuthGate` / `GuestGate` en `src/components/auth-gate.tsx`) evitan
entrar a `/admin` sin sesión y redirigen a `/admin/home` si ya estás logueado
e intentas abrir login/registro/recuperación.

El menú lateral flota sobre el contenido en móvil y queda fijo a partir de 1024 px
de ancho. Sus ítems dependen del rol (`src/constants/navigation.ts`); los que
todavía no tienen pantalla se muestran deshabilitados con la etiqueta «Pronto».

El reparto lo aplica `SurfaceGate` (`src/components/surface-gate.tsx`): si abres una
ruta desde la plataforma equivocada, redirige a la pantalla de entrada de esa
plataforma. Para revisar el diseño móvil desde el navegador, pon
`EXPO_PUBLIC_PREVIEW_ALL=1` en tu `.env`.

## Puesta en marcha

```bash
cp .env.example .env   # apunta EXPO_PUBLIC_API_URL a moldapp-back
npm install
npm run web            # navegador
npm run android        # emulador / dispositivo
npm run ios            # simulador (requiere macOS)
```

Requiere **Node 22.13+** (Metro de Expo 57 no soporta versiones anteriores).

### Variables de entorno

| Variable                   | Para qué sirve                                                        |
| -------------------------- | --------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`      | Base de moldapp-back. En el emulador de Android usa `http://10.0.2.2:3000`. |
| `EXPO_PUBLIC_PREVIEW_ALL`  | `1` desactiva el reparto por plataforma para revisar diseños.          |

## Endpoints que consume

Ver `src/services/`:

- `POST /app/user/login`
- `POST /app/user/sign-up`
- `POST /app/user/resetPassword`
- `GET /app/user/:hash/verifyHash`
- `POST /app/user/:hash/changePassword`
- `GET /app/user/me` y `PATCH /app/user/me` (nombre y correo)
- `POST /app/user/me/photo` (multipart, campo `photo`, máximo 3 MB)
- `GET /app/identification-types`

Cada petición viaja con cabeceras `X-Client-*` (user agent, navegador, dispositivo,
sistema operativo y huella de instalación) para que el backend pueda armar el
registro de la tabla `sessions` —incluida la IP— cuando un hash de recuperación no
coincide.

## Estructura

```
src/
  app/                 rutas de Expo Router
  components/
    brand/             logo y wordmark (SVG)
    ui/                campos, botones, banners, iconos
  constants/           paleta y catálogos
  context/             sesión del usuario
  lib/                 http, storage, validaciones, plataforma
  services/            llamadas al API
```

## Diseño

Paleta oscura definida en `tailwind.config.js` y replicada en JS en
`src/constants/theme.ts`:

- `ink-*`: fondos azul-grises muy oscuros.
- `steel-*`: bordes y texto secundario.
- `accent-*`: azul claro de acento.

El logo es provisional: un molde con una «M» troquelada, dibujado en SVG
(`src/components/brand/logo.tsx`) para que escale sin pérdida en ambas plataformas.

## Ramas

`{tipo}/{descripcion}` partiendo de `develop`, por ejemplo
`feature/pantallas-autenticacion`. Este repositorio no usa IDs de ClickUp.
