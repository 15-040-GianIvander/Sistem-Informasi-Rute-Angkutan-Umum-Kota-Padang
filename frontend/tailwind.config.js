/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07111f',
          900: '#0b1728',
        },
      },
      boxShadow: {
        glow: '0 20px 60px rgba(15, 118, 110, 0.25)',
      },
    },
  },
  plugins: [],
};
