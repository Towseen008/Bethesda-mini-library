/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bethDeepBlue: '#003366',
        bethLightBlue: '#66CCFF',
        bethLightGray: '#F2F2F2',
      },
    },
  },
  plugins: [], 
};