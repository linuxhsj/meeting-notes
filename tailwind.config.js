/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3770FF',
        'primary-light': '#f5f8ff',
        'primary-dark': '#2a5ce0',
        surface: '#FFFFFF',
        background: '#F5F5F5',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'text-muted': '#888888',
        error: '#CF1322',
        'error-bg': '#FFF2F0',
        success: '#52C41A',
        warning: '#FFA940',
        'warning-bg': '#FFFBE6',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      spacing: {
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
      },
    },
  },
  plugins: [],
}
