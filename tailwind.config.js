/** @type {import('tailwindcss').config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        foreground: 'var(--text, #ffffff)',
        background: 'var(--bg, #0f0f0f)',
      },
    },
  },
  plugins: [],
}
