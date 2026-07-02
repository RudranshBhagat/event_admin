/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0A0D',
          900: '#0E0E12',
          800: '#16161C',
          700: '#1F1F28',
          600: '#2A2A35',
        },
        coral: {
          400: '#FF7A87',
          500: '#FF4D5E',
          600: '#E5364B',
        },
        amber: {
          400: '#FFC857',
          500: '#FFB627',
          600: '#E89F1A',
        },
        bone: {
          100: '#F5F3EF',
          200: '#E8E5DD',
          400: '#A8A5A0',
          600: '#6B6864',
        },
      },
      fontFamily: {
        display: ['"Anton"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        rise: {
          '0%': { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(255,77,94,0.5)' },
          '70%': { boxShadow: '0 0 0 14px rgba(255,77,94,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,77,94,0)' },
        },
        tickFlip: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(-90deg)' },
        },
      },
      animation: {
        flicker: 'flicker 3.5s ease-in-out infinite',
        rise: 'rise 0.7s cubic-bezier(0.16,1,0.3,1) both',
        pulseRing: 'pulseRing 2s infinite',
      },
    },
  },
  plugins: [],
};
