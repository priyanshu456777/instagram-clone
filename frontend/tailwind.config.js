/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#121212",
        surface: "#1a1a1a",
        surface2: "#232326",
        border: "#2a2a2e",
        accent: "#22c55e",
        accentSoft: "#16a34a",
        like: "#e24b4a",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};