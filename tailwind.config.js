/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'fnt-red': '#ff4943',
        'fnt-black': '#000000',
        'fnt-white': '#ffffff',
        // Glass design system surfaces
        'ink': {
          950: '#08090b',
          900: '#0b0c0f',
          850: '#101216',
          800: '#14161b',
          700: '#1b1e24',
        },
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': 'inset 0 1px 0 0 rgba(255,255,255,0.10), 0 24px 48px -24px rgba(0,0,0,0.65)',
        'glass-sm': 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 12px 24px -12px rgba(0,0,0,0.5)',
        'glass-red': 'inset 0 1px 0 0 rgba(255,255,255,0.25), 0 12px 32px -12px rgba(255,73,67,0.45)',
        'glass-light': 'inset 0 1px 0 0 rgba(255,255,255,0.65), 0 16px 40px -20px rgba(15,23,42,0.18)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
