/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{html,jsx,js}',
    './components/**/*.{jsx,js}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        devlocator: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
          text: '#f8fafc',
          muted: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};

