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
        wood: {
          950: '#140c07',
          900: '#1f130b',
          850: '#2b1a0f',
          800: '#382214',
          700: '#4d301c',
          600: '#674127',
          500: '#865533',
          400: '#a46f48',
          300: '#c5916b',
        },
        brass: {
          900: '#3d2e05',
          800: '#644e0b',
          700: '#8c6e12',
          600: '#b08b1b',
          500: '#cca325',
          400: '#e5be38',
          300: '#f3d764',
          200: '#fae79b',
          100: '#fdf4cd',
        },
        slateboard: {
          950: '#0f1115',
          900: '#14171d',
          850: '#1a1e24',
          800: '#22272e',
          700: '#2d333b',
          600: '#39414b',
        },
        vintage: {
          emerald: '#1b4d3e',
          'emerald-light': '#2a725c',
          burgundy: '#6b1d2f',
          'burgundy-light': '#8e273f',
          gold: '#c59b27',
          'gold-light': '#e0b53c',
          navy: '#1d3557',
          'navy-light': '#2c4d7d',
          terracotta: '#b35434',
          'terracotta-light': '#d26a45',
          charcoal: '#3d405b',
          'charcoal-light': '#515579',
          lavender: '#534b62',
          'lavender-light': '#6f6483',
          ivory: '#f8f5ee',
          parchment: '#eee6d3',
          chalk: '#e6eaf0',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        cinzel: ['Cinzel', '"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'wood-frame': '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.9)',
        'wood-slot': 'inset 0 3px 6px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.06)',
        'brass-rail': '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.5)',
        'peg-emboss': '2px 3px 6px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.4)',
        'plaque': 'inset 0 1px 2px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
