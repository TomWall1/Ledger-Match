/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          navy: '#1B365D',    // Deep Navy Blue
          teal: '#00A4B4',    // Bright Teal
        },
        secondary: {
          gray: '#647789',    // Slate Gray
          white: '#F5F7FA',   // Soft White
        },
        accent: {
          blue: '#0077CC',    // Electric Blue
          green: '#7BDCB5',   // Mint Green
        },
      },
      container: {
        center: true,
        padding: '1rem',
      },
    },
  },
  plugins: [],
}