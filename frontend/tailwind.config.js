/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LGM Aviation Exact Design Tokens
        'color-1': '#000000', // Text Primary
        'color-2': '#0D98D1', // Accent
        'color-3': '#F5F5F7', // Background
        'color-4': '#FFFFFF', // Background (Card/Surface)
        lgm: {
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          text: '#000000',
          accent: '#0D98D1',
          accentHover: '#0B84B7',
          border: 'rgba(0, 0, 0, 0.08)'
        },
        aviation: {
          navy: '#071521',
          dark: '#0D2233',
          blue: '#0D98D1',
          hover: '#0B84B7',
          cyan: '#38bdf8',
          teal: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          bg: '#F5F5F7',
          card: '#FFFFFF',
          text: '#000000',
          muted: '#64748b',
          border: '#e2e8f0'
        },
        primary: {
          DEFAULT: '#0D98D1',
          hover: '#0B84B7',
          light: '#e0f2fe'
        },
        paper: {
          DEFAULT: '#F5F5F7',
          dark: '#E2E8F0',
          contrast: '#FFFFFF'
        },
        ink: {
          DEFAULT: '#000000',
          soft: '#1e293b'
        },
        stone: {
          DEFAULT: '#64748b',
          light: '#94a3b8'
        },
        hairline: {
          DEFAULT: '#e2e8f0',
          dark: '#cbd5e1'
        },
        apron: {
          DEFAULT: '#0D98D1',
          hover: '#0B84B7'
        },
        status: {
          available: '#059669',
          reserved: '#d97706',
          occupied: '#2563eb',
          maintenance: '#dc2626',
          closed: '#64748b'
        }
      },
      spacing: {
        'space-1': '6px',
        'space-2': '15px',
        'space-3': '24px',
        'space-4': '32px',
        'space-5': '47px',
        'space-6': '64px'
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Host Grotesk"', '"DM Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        tabular: ['"IBM Plex Mono"', 'monospace']
      },
      transitionTimingFunction: {
        'lgm': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'slow': '500ms',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px'
      }
    },
  },
  plugins: [],
}
