import type { Config } from 'tailwindcss';

/**
 * Tailwind design tokens
 * - HSLベースでdark mode / テーマ切替に耐える構造
 * - カラーは CSS variables 経由で参照（globals.css で定義）
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        // 科目別カラー（review画面の区分けに使用）
        subject: {
          law: 'hsl(var(--subject-law))',
          terms: 'hsl(var(--subject-terms))',
          practice: 'hsl(var(--subject-practice))',
        },
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,19,41,0.035), 0 6px 20px -4px rgba(10,19,41,0.06)',
        float: '0 4px 12px rgba(10,19,41,0.05), 0 20px 48px -12px rgba(10,19,41,0.12)',
        premium:
          '0 0 0 1px rgba(200,205,215,0.45), 0 1px 2px rgba(10,19,41,0.04), 0 12px 32px -8px rgba(10,19,41,0.08)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ring-fill': {
          '0%': { strokeDashoffset: 'var(--from, 251)' },
          '100%': { strokeDashoffset: 'var(--to, 0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'ring-fill': 'ring-fill 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
