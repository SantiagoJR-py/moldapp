import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Documento HTML de la versión web (solo existe en web). Lo que dibuja el navegador por su
 * cuenta (selección, cursor, barras de desplazamiento, anillo de foco) también lleva la paleta.
 */
const browserSurfaces = `
html, body { background-color: #080C12; }
::selection { background: rgba(77, 163, 255, 0.35); color: #F1F5F9; }
input, textarea { caret-color: #4DA3FF; }
* { scrollbar-width: thin; scrollbar-color: #31506B transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1D3A56; border-radius: 9999px; border: 3px solid #080C12; }
::-webkit-scrollbar-thumb:hover { background: #31506B; }
:focus-visible { outline: 2px solid #4DA3FF; outline-offset: 2px; }
input:focus-visible, textarea:focus-visible { outline: none; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#080C12" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: browserSurfaces }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
