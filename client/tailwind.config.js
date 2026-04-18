/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        secondary: '#1A1A1A',
        accent: '#D4AF37', // Metallic Gold for Premium Status
        darker: '#000000',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], 
        premium: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
