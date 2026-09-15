import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF6",
          100: "#FAF5EA",
          200: "#F3EAD3",
          300: "#E9DBB8",
        },
        wood: {
          400: "#8A6A4F",
          500: "#6B4E3A",
          600: "#4E3A2B",
          700: "#3A2A1F",
          800: "#2A1E16",
          900: "#1C140E",
        },
        forest: {
          400: "#7A9A7E",
          500: "#5C7D60",
          600: "#46614A",
          700: "#354A38",
        },
        dusk: {
          400: "#8FA8BD",
          500: "#6E8CA3",
          600: "#4F6D85",
          700: "#3A5266",
        },
        burgundy: {
          400: "#A9646B",
          500: "#8B4750",
          600: "#6E353D",
          700: "#54272D",
        },
      },
      fontFamily: {
        serif: ["var(--font-passage)", "Georgia", "serif"],
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        book: "0.25rem 0.5rem 0.5rem 0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
