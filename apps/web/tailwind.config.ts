import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B1F3A',
          blue: '#1769AA',
          orange: '#FF8A00',
          bg: '#F4F7FB',
          text: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
          'border-strong': '#CBD5E1',
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          primary: '#1769AA',
          'primary-hover': '#0F568F',
          surface: '#FFFFFF',
          card: '#F8FAFC',
          'card-hover': '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
