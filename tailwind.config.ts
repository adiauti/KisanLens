import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Earthy agricultural palette
        leaf: {
          50: '#f3faf3',
          100: '#e3f4e3',
          200: '#c7e8c8',
          300: '#9bd49c',
          400: '#69b86a',
          500: '#449c47',
          600: '#347e38',
          700: '#2c642f',
          800: '#265029',
          900: '#214225',
          950: '#0e2410',
        },
        soil: {
          50: '#faf6f1',
          100: '#f1e8d9',
          200: '#e3d2b5',
          300: '#d1b388',
          400: '#bf915e',
          500: '#b07a45',
          600: '#9a6238',
          700: '#7e4d2f',
          800: '#67402c',
          900: '#553628',
          950: '#2e1b13',
        },
        cream: {
          50: '#fefdf9',
          100: '#fdf9ed',
          200: '#faf1d5',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(46, 80, 41, 0.08)',
        card: '0 2px 12px -2px rgba(46, 80, 41, 0.12)',
        cardHover: '0 12px 32px -4px rgba(46, 80, 41, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'grow': 'grow 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        grow: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'leaf-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2327c93f' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
