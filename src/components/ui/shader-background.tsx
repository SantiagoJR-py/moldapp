import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette } from '@/constants/theme';

/**
 * Fondo halftone animado: una retícula de puntos que respira, con viñeta y
 * grano, en los azules de ENTRYX.
 *
 * Es un port a `expo-gl` del shader original de navegador. Lo que cambio y por
 * que:
 *
 * - El original dibuja sobre un `<canvas>` del DOM y usa `ResizeObserver`,
 *   `IntersectionObserver` y `visibilitychange`. Nada de eso existe en React
 *   Native; aqui el tamano lo da `gl.drawingBufferWidth/Height` y el ciclo de
 *   vida lo lleva el propio componente.
 * - Se elimino todo el bloque de cursor (`u_cursor`, `pointermove`): en una
 *   pantalla tactil no hay hover, el dedo solo toca.
 * - Se eliminaron `fbm`/`noise`/OKLab/`hueRotate` porque en este preset sus
 *   uniformes valen 0 y no aportan nada al resultado. El shader queda mucho
 *   mas corto, que en un movil se nota al compilar y al dibujar.
 * - `gl.endFrameEXP()` es obligatorio en expo-gl al cerrar cada cuadro.
 */

const VERT = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_intensity;
uniform float u_alpha;

const float SCALE = 1.78;
const float ROTATE = 2.9845;
const float DRIFT = 0.136;
const float SEED = 1.7;
const float CONTRAST = 0.82;
const float BRIGHTNESS = -0.10;
const float SATURATION = 1.15;
const float VIGNETTE = 1.0;
const float BLUR = 0.04;
const float GRAIN = 0.10;
const vec2 OFFSET = vec2(-0.25, -0.02);

// Ruido blanco parejo para el grano (hash12 de Dave Hoskins). Un hash por
// multiplicacion deja una malla tenue alineada a los ejes que se ve como red.
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 palette(float x) {
  return mix(u_colorA, u_colorB, smoothstep(0.0, 1.0, clamp(x, 0.0, 1.0)));
}

vec3 shade(vec2 p, float t) {
  float cells = 18.0 + u_intensity * 30.0;
  vec2 f = fract(p * cells) - 0.5;
  float field = 0.5 + 0.5 * sin(p.x * 3.0 + t + SEED) * sin(p.y * 2.4 - t * 0.7);
  float r = 0.4 + field * 0.2;
  float dotMask = 1.0 - smoothstep(r - 0.08, r, length(f));
  return mix(u_colorA, palette(field), dotMask);
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);

  p *= SCALE;
  float cr = cos(ROTATE), sr = sin(ROTATE);
  p = mat2(cr, -sr, sr, cr) * p;
  p += OFFSET;
  p += DRIFT * vec2(sin(u_time * 0.31), cos(u_time * 0.23));

  // Desenfoque suave de 5 muestras.
  float pe = BLUR * SCALE;
  vec3 col  = shade(p, u_time) * 0.36;
  col += shade(p + vec2(pe, 0.0), u_time) * 0.16;
  col += shade(p - vec2(pe, 0.0), u_time) * 0.16;
  col += shade(p + vec2(0.0, pe), u_time) * 0.16;
  col += shade(p - vec2(0.0, pe), u_time) * 0.16;

  col = (col - 0.5) * CONTRAST + 0.5;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, SATURATION);
  col += BRIGHTNESS;

  float vd = length(screenUv - 0.5) * 1.41421356;
  col *= 1.0 - VIGNETTE * smoothstep(0.35, 1.0, vd);
  col += (grainHash(gl_FragCoord.xy) - 0.5) * GRAIN;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), u_alpha);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type ShaderBackgroundProps = {
  style?: StyleProp<ViewStyle>;
  /** Densidad de la retícula de puntos. */
  intensity?: number;
  /** Opacidad del resultado, para dejarlo por debajo del contenido. */
  alpha?: number;
};

export function ShaderBackground({ style, intensity = 0.19, alpha = 1 }: ShaderBackgroundProps) {
  const frameRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) reduceMotionRef.current = enabled;
      })
      .catch(() => {});

    return () => {
      active = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    const vertexShader = compile(gl.VERTEX_SHADER, VERT);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.useProgram(program);

    // Un unico triangulo que cubre la pantalla: mas barato que dos.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');
    const uAlpha = gl.getUniformLocation(program, 'u_alpha');

    gl.uniform3fv(gl.getUniformLocation(program, 'u_colorA'), hexToRgb(palette.ink900));
    gl.uniform3fv(gl.getUniformLocation(program, 'u_colorB'), hexToRgb(palette.accent600));
    gl.uniform1f(uIntensity, intensity);
    gl.uniform1f(uAlpha, alpha);

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uResolution, width, height);

    const start = Date.now();

    const render = () => {
      // El preset avanza en negativo; asi la deriva va en el mismo sentido que
      // el original de navegador.
      const elapsed = ((Date.now() - start) / 1000) * -0.518;
      gl.uniform1f(uTime, reduceMotionRef.current ? 0 : elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.endFrameEXP();

      // Con "reducir movimiento" activo se dibuja un solo cuadro fijo: ni gasta
      // bateria ni marea a quien lo pidio.
      if (!reduceMotionRef.current) frameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, style]}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}
