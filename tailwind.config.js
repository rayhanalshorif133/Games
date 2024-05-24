/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      width:{
        "360": "360px",
      },
      translate: {
        '134': '134px',
        '268': '268px',
        '402': '402px',
        '536': '536px',
      }
    },
  },
  plugins: [],
}