/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      width:{
        "360": "360px",
      },
      margin:{
        "110": "110px",
        "55" : "55px",
      }
    },
  },
  plugins: [],
}