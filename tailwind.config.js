/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F14',
        surface: '#121821',
        card: '#1A2230',
        primary: '#FFC107',
        'primary-fg': '#0B0F14',
        income: '#22C55E',
        expense: '#EF4444',
        muted: '#94A3B8',
        border: '#253042',
      },
    },
  },
  plugins: [],
};
