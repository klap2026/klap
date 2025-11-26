import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System: "Refined Industrial"
        primary: {
          navy: '#1a365d',
          DEFAULT: '#1a365d',
        },
        accent: {
          orange: '#dd6b20',
          DEFAULT: '#dd6b20',
        },
        status: {
          success: '#38a169',
          warning: '#d69e2e',
          danger: '#e53e3e',
          blocked: '#a0aec0',
        },
        efficiency: {
          gold: '#38a169',    // High efficiency <10min
          silver: '#d69e2e',  // Medium efficiency 20-30min
          red: '#e53e3e',     // Low efficiency >30min
          blocked: '#a0aec0', // Blocked/unavailable
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
