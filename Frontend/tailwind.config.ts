/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        signal: {
          blue: "#305EE7",
          ultramarine: "#3A76F0",
          bg: "#F5F6F8",
          bubble: "#E5E5E5",
        },
      },
    },
  },
  plugins: [],
};