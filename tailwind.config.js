/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta ENTRYX. Los nombres de escala se conservan del tema anterior
        // para no romper las clases ya escritas; solo cambian los valores.
        //
        // Fondos y superficies: del obsidiana al azul acero.
        ink: {
          950: '#080C12', // Obsidian  - fondo raiz
          900: '#0D1B2A', // Police Navy - superficie / tarjeta
          800: '#142B42', // Deep Blue - superficie elevada
          700: '#1D3A56', // hairline fuerte
          600: '#31506B', // Steel Blue - bordes
          500: '#3F6183', // borde resaltado
        },
        // Borde casi invisible de las superficies (ver `surface` en theme.ts).
        hairline: 'rgba(203, 213, 225, 0.07)',
        // Texto y bordes claros.
        steel: {
          700: '#31506B', // Steel Blue
          600: '#475569',
          500: '#64748B', // Slate - texto terciario
          400: '#8494A8',
          300: '#A8B6C8',
          200: '#CBD5E1', // Ice Gray - texto secundario
          100: '#F1F5F9', // Off White - texto primario
        },
        // Acento de marca.
        accent: {
          700: '#1B5FBF',
          600: '#2F80ED', // Tech Blue - boton primario
          500: '#3D8FF5',
          400: '#4DA3FF', // Electric Blue - enlaces e iconos
          300: '#7FBEFF',
          200: '#B3D9FF',
        },
        state: {
          success: '#34D399',
          danger: '#FB7185',
          warning: '#FBBF24',
        },
      },
      borderRadius: {
        field: '14px',
        card: '20px',
        sheet: '28px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
