# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

El lenguaje de diseño es el de una app de iPhone y se mantiene igual en Android y en la web
(Expo + React Native Web). La consola de portería en el PC de la caseta es la misma app en el
navegador, con un diseño más ancho.

## Users

- **Portería (rol WARDEN):** vigilantes en la caseta de entrada de la institución. Trabajan de
  pie o con atención dividida entre la calle, la barrera y la pantalla. Su trabajo es saber qué
  vehículo entra o sale y frenar a los que no están inscritos hasta inscribirlos con la tarjeta
  de propiedad (TP).
- **Personal administrativo (ADMINISTRATIVE_STAFF):** supervisa la portería y ve lo mismo.
- **Comunidad (estudiantes, docentes, personal, externos):** entran a la institución e
  inscriben sus propios vehículos en *Mis vehículos*.

## Product Purpose

ENTRYX controla el acceso vehicular de una institución: las cámaras de portería leen las
placas, el sistema cruza cada placa con los vehículos inscritos y registra entradas y salidas.
Lo más importante es la **alerta cuando entra un vehículo sin registrar**: debe ser imposible
pasarla por alto, y queda pendiente hasta que portería la resuelve.

## Positioning

Lectura de placas que corre completa en el PC de portería, sin enviar imágenes a internet, y
que resuelve el caso del vehículo desconocido en la misma pantalla: la alerta lleva directo a
inscribirlo con una foto de la TP, que se lee y no se guarda.

## Operating Context

- PC de la caseta: monitor de cámaras en vivo con detección, historial y alertas.
- Celular del vigilante (Expo Go por ahora): cámaras, alertas, historial e inscripción con la
  cámara del teléfono, que también puede servir de detector portátil.
- Cámaras: fijas de seguridad (RTSP/DVR o USB) manejadas por el servicio de visión
  `entryx-lpr` en el PC de portería, y la cámara del propio dispositivo. Mientras no haya
  cámaras reales se prueba con videos en bucle.
- Placas colombianas: carro ABC123, moto ABC12D o ABC12.

## Capabilities and Constraints

- Detección de placas con fast-alpr en CPU (unos 5 cuadros por segundo por cámara).
- Lectura de la TP con RapidOCR: placa, marca, línea, modelo, color, clase y servicio. La foto
  vive solo en memoria y los datos del propietario impresos en la TP se ignoran.
- Al inscribir en portería, **el propietario (nombre y documento) se escribe a mano** durante la
  validación. Si el documento ya tiene cuenta en ENTRYX, el vehículo queda vinculado a esa
  persona.
- Una alerta de vehículo sin registrar se resuelve inscribiéndolo con la TP o dejándolo pasar
  como visita de un día con un motivo.
- Todo el texto de la interfaz y los comentarios del código van en español.
- Stack: Expo SDK 57, Expo Router, NativeWind 4, Reanimated 4 con React Compiler; backend
  Express + Sequelize + MySQL (`moldapp-back`); servicio de visión FastAPI (`entryx-lpr`).

## Brand Commitments

- Nombre **ENTRYX** (el repo del backend sigue llamándose `moldapp-back`).
- Imagotipo, isotipo y tipografía de marca (Michroma) en `assets/images/`.
- Paleta oficial: Obsidian #080C12, Police Navy #0D1B2A, Deep Blue #142B42, Steel Blue
  #31506B, Tech Blue #2F80ED, Electric Blue #4DA3FF, Slate #64748B, Ice Gray #CBD5E1,
  Off White #F1F5F9. Solo modo oscuro.
- Debe sentirse costosa, elegante y moderna como una app de iPhone, con animaciones y la
  sensación de que todo es rápido. El móvil manda.

## Evidence on Hand

- Videos de prueba en `entryx-lpr/videos/` (solo uso interno).
- Tarjeta de propiedad sintética en `entryx-lpr/tests/fixtures/`. No hay fotos reales de TP
  ni métricas de precisión con cámaras reales todavía.

## Product Principles

1. La alerta de vehículo sin registrar manda sobre todo lo demás en la pantalla de portería.
2. Cada alerta termina en una acción: inscribir con la TP o dejar pasar con motivo.
3. Menos pasos que el papel: lo que la cámara o la TP ya leyeron no se vuelve a escribir.
4. Lo que se ve en el PC y en el celular es el mismo flujo, adaptado al tamaño.
5. Privacidad por diseño: las fotos de la TP no se guardan y todo corre en el equipo local.

## Accessibility & Inclusion

Pantallas leídas de reojo y a distancia en la caseta: estados por color siempre acompañados de
texto o icono, contraste alto, objetivos táctiles grandes y respeto por "reducir movimiento".
