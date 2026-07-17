/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2e6',
          100: '#fce0bf',
          200: '#f9c696',
          300: '#f5a96b',
          400: '#f2914a',
          500: '#e67e22',
          600: '#cc6f1f',
          700: '#a35a19',
          800: '#7a4313',
          900: '#522d0d',
        },
      },
    },
  },
  plugins: [],
}
