/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Fondos: azul-grises muy oscuros.
        ink: {
          950: '#080B10',
          900: '#0C1117',
          800: '#121924',
          700: '#1A2331',
          600: '#243040',
          500: '#304054',
        },
        // Bordes y texto secundario.
        steel: {
          700: '#2A3644',
          600: '#3A4859',
          500: '#55657A',
          400: '#7C8A9C',
          300: '#A3AFBF',
          200: '#C9D2DD',
          100: '#E7ECF2',
        },
        // Acento: azul claro.
        accent: {
          700: '#1668B8',
          600: '#1E7FD6',
          500: '#3A98EA',
          400: '#5FB0F2',
          300: '#8FC9F8',
          200: '#C2E2FC',
        },
        state: {
          success: '#4ADE80',
          danger: '#F87171',
          warning: '#FBBF24',
        },
      },
      borderRadius: {
        card: '20px',
        field: '14px',
      },
    },
  },
  plugins: [],
};
