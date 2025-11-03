/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {"50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a","950":"#172554"},
        secondary: {"50":"#f8fafc","100":"#f1f5f9","200":"#e2e8f0","300":"#cbd5e1","400":"#94a3b8","500":"#64748b","600":"#475569","700":"#334155","800":"#1e293b","900":"#0f172a","950":"#020617"},
        golden: {"50":"#fffbeb","100":"#fef3c7","200":"#fde68a","300":"#fcd34d","400":"#fbbf24","500":"#f59e0b","600":"#d97706","700":"#b45309","800":"#92400e","900":"#78350f","950":"#451a03"}
      },
      fontFamily: {
        'body': [ 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji' ],
        'sans': [ 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji' ]
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'gradient-flow': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'text-shine': {
          '0%': { 'background-position': '200% center' },
          '100%': { 'background-position': '-200% center' },
        },
        'background-pan': {
          '0%': { 'background-position': '15% 0%' },
          '50%': { 'background-position': '85% 100%' },
          '100%': { 'background-position': '15% 0%' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'gradient-flow': 'gradient-flow 15s ease infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'text-shine': 'text-shine 3s linear infinite',
        'background-pan': 'background-pan 20s linear infinite',
      },
    }
  },
  plugins: [],
}