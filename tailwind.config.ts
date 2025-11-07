/** @type {import('tailwindcss').Config} */

const pixelFontFamily = [
  '"Press Start 2P"',
  'Courier New',
  'monospace',
];

const config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
        pixel: pixelFontFamily,
        body: pixelFontFamily,
        marquee: pixelFontFamily,
        dialogue: pixelFontFamily
      },
      colors: {
        white: '#F5F6FA',
        blue: {
          '50': '#eff4ff',
          '100': '#dbe6fe',
          '200': '#bfd3fe',
          '300': '#93b4fd',
          '400': '#6090fa',
          '500': '#3b76f6',
          '600': '#2563eb', // Base
          '700': '#1d58d8',
          '800': '#1e4baf',
          '900': '#1e408a',
          '950': '#172a54',
        }
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate')
  ],
};

export default config;
