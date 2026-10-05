/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "#08A6B5", dark: "#078996" },
        navy: { DEFAULT: "#0B2945", light: "#173B59" }
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
