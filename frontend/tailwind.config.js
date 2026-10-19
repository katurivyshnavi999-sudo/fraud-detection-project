/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#f8fafc', // Clean light gray/white background
          surface: '#ffffff',
          card: '#ffffff',
          border: '#e2e8f0',
          muted: '#64748b',
          dark: '#0f172a'
        },
        navy: {
          950: '#070d19',
          900: '#0b132b',
          850: '#0f1b3b',
          800: '#14224d',
          700: '#1c2d5e',
          600: '#263b75'
        },
        risk: {
          safe: '#10b981',       // Green for safe
          safelight: '#ecfdf5',
          safeborder: '#a7f3d0',
          suspicious: '#f59e0b', // Orange for suspicious
          suspiciouslight: '#fffbeb',
          suspiciousborder: '#fde68a',
          fraud: '#ef4444',      // Red for fraud
          fraudlight: '#fef2f2',
          fraudborder: '#fecaca'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', 'monospace']
      },
      boxShadow: {
        'fintech': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'fintech-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'fintech-lg': '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      }
    },
  },
  plugins: [],
}
