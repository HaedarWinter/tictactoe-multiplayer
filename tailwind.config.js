/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // slate-900
        card: '#1e293b',      // slate-800
        primary: '#8b5cf6',   // violet-500
        secondary: '#f43f5e', // rose-500
        accent: '#22d3ee',    // cyan-400
        success: '#22c55e',   // green-500
        warning: '#eab308',   // yellow-500
        error: '#ef4444',     // red-500
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(139, 92, 246, 0.5)',
        'glow-secondary': '0 0 15px rgba(244, 63, 94, 0.5)',
      },
    },
  },
  plugins: [],
} 