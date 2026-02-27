/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GO! CVO Antwerpen brand colors
        primary: {
          50:  '#f0f9f8',
          100: '#d0efed',
          200: '#a1e0dd',
          300: '#6ccfcb',
          400: '#3dbbb6',
          500: '#259c95',   // lighter teal
          600: '#197a77',   // CVO Antwerpen primary
          700: '#146461',
          800: '#0f4a47',
          900: '#0a302e',
        },
        'go-magenta': '#c4004b',
        'go-turquoise': '#67c0ba',
        'go-purple': '#532464',
      },
    },
  },
  plugins: [],
}
