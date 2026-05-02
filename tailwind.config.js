/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8f5',
          100: '#d7f0e9',
          500: '#129674',
          600: '#0d7a60',
          700: '#0b624f',
        },
        ink: '#17212b',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};
