/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // HolyRave brand — dark, sacred, electronic
        void: '#0a0a0f',
        'void-light': '#1a1a2e',
        gold: '#d4af37',
        'gold-light': '#f0d060',
        crimson: '#8b1a2b',
        'crimson-light': '#b52a3f',
        ivory: '#f5f0e8',
        'text-muted': '#a0a0b0',
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
