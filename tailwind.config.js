/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx,html}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        'yt-red': '#FF0000',
        'mac-bg': 'rgba(18, 18, 18, 0.7)',
      },
    },
  },
  plugins: [],
}
