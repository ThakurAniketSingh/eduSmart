/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0D14',
          900: '#0F131C',
          850: '#131826',
          800: '#171D2D',
          700: '#212940',
          600: '#2B3550',
        },
        signal: {
          400: '#7DD3B0',
          500: '#4FBF8F',
          600: '#3AA378',
        },
        amber: {
          400: '#F3B562',
          500: '#EC9B3B',
        },
        violet: {
          400: '#9C8CFF',
          500: '#7C67F0',
          600: '#6552D6',
        },
        // Theme-aware semantic colors via CSS variables
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.5)',
        'panel-light': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 16px -4px rgba(0,0,0,0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.35 },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
