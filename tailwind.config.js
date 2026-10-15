/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--bg-base) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        surfaceLegacy: {
          0: '#0A2238', // Layer 0: Base Viewport background
          1: '#0F2D4A', // Layer 1: Primary card / section container
          2: '#143755', // Layer 2: Nested / elevated card
          3: '#1A4366', // Layer 3: Hover / interactive surface state
        },
        semantic: {
          primary: {
            light: '#065f46',        // emerald-800 (WCAG AA/AAA 7.9:1 on light)
            DEFAULT: '#059669',      // emerald-600 (CTA button)
            dark: '#34d399',         // emerald-400 (WCAG AA/AAA 9.8:1 on dark)
            surfaceLight: '#ecfdf5', // emerald-50
            surfaceDark: '#022c22',  // emerald-950
            borderLight: '#6ee7b7',  // emerald-300
            borderDark: '#065f46',   // emerald-800
          },
          success: {
            light: '#0f766e',        // teal-700 (WCAG AA 5.4:1 on light - separated from primary)
            DEFAULT: '#0d9488',      // teal-600
            dark: '#5eead4',         // teal-300 (WCAG AAA 12.4:1 on dark)
            surfaceLight: '#f0fdfa', // teal-50
            surfaceDark: '#042f2e',  // teal-950
            borderLight: '#99f6e4',  // teal-200
            borderDark: '#115e59',   // teal-800
          },
          info: {
            light: '#1d4ed8',        // blue-700 (WCAG AA 6.7:1 on light)
            DEFAULT: '#2563eb',      // blue-600
            dark: '#38bdf8',         // sky-400 (WCAG AAA 9.4:1 on dark)
            surfaceLight: '#eff6ff', // blue-50
            surfaceDark: '#082f49',  // sky-950
            borderLight: '#bfdbfe',  // blue-200
            borderDark: '#0369a1',   // sky-700
          },
          warning: {
            light: '#92400e',        // amber-800 (WCAG AA 6.5:1 on light)
            DEFAULT: '#f59e0b',      // amber-500
            dark: '#fcd34d',         // amber-300 (WCAG AAA 13.1:1 on dark)
            surfaceLight: '#fffbeb', // amber-50
            surfaceDark: '#451a03',  // amber-950
            borderLight: '#fcd34d',  // amber-300
            borderDark: '#92400e',   // amber-800
          },
          danger: {
            light: '#be123c',        // rose-700 (WCAG AA 6.3:1 on light)
            DEFAULT: '#e11d48',      // rose-600
            dark: '#fda4af',         // rose-300 (WCAG AAA 10.2:1 on dark)
            surfaceLight: '#fff1f2', // rose-50
            surfaceDark: '#4c0519',  // rose-950
            borderLight: '#fda4af',  // rose-300
            borderDark: '#9f1239',   // rose-800
          },
        },
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-border': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-border': 'pulse-border 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
