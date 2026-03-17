/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', 'serif'],
        sans: ['"Avenir Next"', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
