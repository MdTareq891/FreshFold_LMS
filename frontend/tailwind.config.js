/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0b1a2c",
          900: "#1b3a5c",
          800: "#234a73",
          700: "#2e5a88",
        },
        teal: {
          600: "#0f8b8d",
          500: "#14a3a5",
          400: "#3ec1c3",
          100: "#e3f6f6",
        },
        sand: {
          50: "#faf8f4",
          100: "#f2ede2",
          200: "#e6dcc9",
        },
        clay: {
          500: "#c97b4a",
        },
      },
      fontFamily: {
        display: ["Georgia", "'Times New Roman'", "serif"],
        body: ["'Segoe UI'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(15,35,56,0.08)",
        card: "0 4px 20px rgba(15,35,56,0.10)",
      },
    },
  },
  plugins: [],
};
