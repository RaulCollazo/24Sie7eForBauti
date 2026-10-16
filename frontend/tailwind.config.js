/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#A9310A',
          50: '#F7EDE8',
          100: '#F0D8CC',
          200: '#E0B199',
          300: '#D08B66',
          400: '#C16433',
          500: '#A9310A',
          600: '#CB4922',
          700: '#9A2C09',
          800: '#7B2407',
          900: '#5C1C06',
        },
        bg: {
          primary: '#FFFFFF',
          secondary: '#F9F9F9',
          tertiary: '#F3F3F3',
        },
        text: {
          primary: '#1B1B1B',
          muted: '#5E5E5C',
        },
        border: '#E2E2E2',
        danger: '#BA1A1A',
      },
      fontFamily: {
        sans: ['Work Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Work Sans', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Work Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
