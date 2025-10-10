/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F0DCE',
        primaryLight: '#7765DA',
        secondary: '#5767D0',
        grayDark: '#373737',
        grayMid: '#6E6E6E',
        grayLight: '#F2F2F2',
      },
    },
  },
  plugins: [],
}
