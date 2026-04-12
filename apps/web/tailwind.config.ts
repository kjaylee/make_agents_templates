import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

/**
 * Anvil design tokens.
 * See docs/DESIGN.md §3 (color), §4 (type), §5 (texture), §11 (token dump).
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Light palette — "Paper & Ember"
        ink: {
          900: '#1A1613',
          700: '#2F2722',
          500: '#6B5E54',
          300: '#B8A99C'
        },
        bone: {
          50: '#FFFDF8',
          100: '#FAF7F1',
          200: '#F0EBE0'
        },
        ember: {
          100: '#FCE8DC',
          400: '#F27049',
          500: '#D9541F',
          600: '#B63F0E'
        },
        iron: { 600: '#3D4D58' },
        gold: { 500: '#E8A13A' },
        jade: { 500: '#4A9B7F' },
        rust: { 500: '#A63A1A' },
        // shadcn/ui CSS variable colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // Dark palette — "Smithy Night"
        smithy: {
          900: '#0F0C0A',
          800: '#1A1512',
          700: '#26201B'
        },
        fg: {
          100: '#F5EFE6',
          300: '#BFB4A6'
        }
      },
      fontFamily: {
        display: ['"Tiempos Headline"', 'Georgia', 'serif'],
        body: ['var(--font-inter)', '"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"Berkeley Mono"', 'var(--font-jetbrains-mono)', '"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '10px'
      },
      backgroundImage: {
        'paper-grain': "url('/textures/grain-2pct.svg')"
      },
      boxShadow: {
        ember: '0 6px 20px -8px rgba(217, 84, 31, 0.15)',
        'ember-lg': '0 12px 40px -12px rgba(217, 84, 31, 0.25)',
        anvil: '0 1px 0 0 rgba(26, 22, 19, 0.04) inset'
      },
      keyframes: {
        'hammer-strike': {
          '0%': { transform: 'translateY(-40px) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'translateY(4px) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'translateY(0) rotate(0)', opacity: '1' }
        },
        'ember-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217, 84, 31, 0.4)' },
          '50%': { boxShadow: '0 0 0 20px rgba(217, 84, 31, 0)' }
        },
        'receipt-unroll': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' }
        }
      },
      animation: {
        'hammer-strike': 'hammer-strike 380ms cubic-bezier(.35,1.6,.64,1)',
        'ember-pulse': 'ember-pulse 600ms ease-out infinite',
        'receipt-unroll': 'receipt-unroll 900ms ease-out'
      }
    }
  },
  plugins: [tailwindcssAnimate]
}

export default config
