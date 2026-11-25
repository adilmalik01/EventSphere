/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3eee6",
        cream: "#faf7f2",
        ink: "#1c1915",
        muted: "#6d655c",
        line: "#e3dacd",
        clay: "#b8432f",
        pine: "#1e4638",
        gold: "#8a6a3b",
      },
      fontFamily: {
        sans: ["Outfit", "Segoe UI", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 18px 40px rgba(28, 25, 21, 0.06)",
      },
    },
  },
  plugins: [],
};
