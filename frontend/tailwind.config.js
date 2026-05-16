/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        card: '#1e293b',
        accent: '#06b6d4',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8'
      }
    },
  },
  plugins: [],
}
