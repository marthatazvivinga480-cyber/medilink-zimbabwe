/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "rgb(var(--color-teal-rgb) / <alpha-value>)", dark: "rgb(var(--color-teal-dark-rgb) / <alpha-value>)" },
        navy: { DEFAULT: "rgb(var(--color-navy-rgb) / <alpha-value>)", light: "#173B59" }
      },
      fontFamily: {
        display: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};