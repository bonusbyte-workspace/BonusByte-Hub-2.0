/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#000000',
          900: '#0B0B0C',
          800: '#111113',
          700: '#1A1A1D',
          600: '#242428',
        },
        chrome: {
          100: '#F5F5F5',
          200: '#E8E8E8',
          300: '#D0D0D0',
          400: '#B8B8B8',
          500: '#9A9A9A',
          600: '#7A7A7A',
          700: '#5A5A5A',
          800: '#3A3A3A',
        },
        steel: {
          400: '#7A8A99',
          500: '#5A6A79',
        },
        energy: {
          400: '#4FC3F7',
          500: '#29B6F6',
          600: '#0288D1',
        },
        staking: {
          gold: '#D4AF37',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
        },
      },
      backgroundImage: {
        'chrome-gradient': 'linear-gradient(135deg, #8C8C8C 0%, #E8E8E8 25%, #C0C0C0 50%, #F5F5F5 75%, #9A9A9A 100%)',
        'chrome-button': 'linear-gradient(180deg, #D0D0D0 0%, #9A9A9A 40%, #7A7A7A 60%, #B8B8B8 100%)',
        'obsidian-radial': 'radial-gradient(ellipse at center top, #1A1A2E 0%, #0B0B0C 40%, #000000 100%)',
        'cosmic-deep': 'radial-gradient(ellipse 80% 60% at 50% 0%, #0D1117 0%, #000000 100%)',
        'energy-bar': 'linear-gradient(90deg, #0288D1 0%, #4FC3F7 60%, #B3E5FC 100%)',
        'gold-gradient': 'linear-gradient(135deg, #8B6914 0%, #D4AF37 35%, #FFD700 50%, #D4AF37 65%, #8B6914 100%)',
        'card-metallic': 'linear-gradient(145deg, #1A1A1D 0%, #111113 50%, #1A1A1D 100%)',
      },
      boxShadow: {
        'chrome-glow': '0 0 20px rgba(192,192,192,0.15), 0 0 40px rgba(192,192,192,0.08)',
        'energy-glow': '0 0 16px rgba(79,195,247,0.4), 0 0 32px rgba(79,195,247,0.2)',
        'coin-press': '0 2px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card-raised': '0 4px 24px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
        'tap-particle': '0 2px 8px rgba(79,195,247,0.5)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-chrome': 'pulse-chrome 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'particle-rise': 'particle-rise 1.2s ease-out forwards',
        'splash-in': 'splash-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'energy-fill': 'energy-fill 0.3s ease-out forwards',
        'logo-rotate': 'logo-rotate 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-chrome': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(192,192,192,0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(192,192,192,0.35), 0 0 60px rgba(192,192,192,0.15)' },
        },
        'particle-rise': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-80px) scale(0.6)' },
        },
        'splash-in': {
          '0%': { opacity: '0', transform: 'scale(0.5) rotateY(-15deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0deg)' },
        },
        'logo-rotate': {
          '0%': { transform: 'rotateY(0deg) scale(1)' },
          '25%': { transform: 'rotateY(15deg) scale(1.02)' },
          '75%': { transform: 'rotateY(-15deg) scale(1.02)' },
          '100%': { transform: 'rotateY(0deg) scale(1)' },
        },
        'energy-fill': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      perspective: {
        '500': '500px',
        '1000': '1000px',
        '1500': '1500px',
      },
    },
  },
  plugins: [],
};
