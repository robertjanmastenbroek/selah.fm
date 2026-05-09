/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // sendmusic.io — dark music marketplace
        void: '#08080d',
        'void-elevated': '#141420',
        'void-card': '#1a1a2e',
        gold: '#f0c040',
        'gold-hover': '#f5d060',
        'gold-muted': '#c4a030',
        crimson: '#8b1a2b',
        'crimson-light': '#b52a3f',
        ivory: '#f5f0e8',
        muted: '#8888a0',
        'muted-light': '#aaaabc',
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
