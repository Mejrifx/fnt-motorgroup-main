/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'fnt-red': '#ff4943',
        'fnt-black': '#000000',
        'fnt-white': '#ffffff',
      },
    },
  },
  plugins: [],
};
