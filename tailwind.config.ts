import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#8B4513", // Chocolate Brown
          light: "#A0522D",
          dark: "#654321",
        },
        secondary: {
          DEFAULT: "#A96E2B", // Burnt Orange
          light: "#C8955A",
          dark: "#8B5E3C",
        },
        accent: {
          gold: "#D4AF37",
          teal: "#008080",
          "gold-light": "#E5C158",
          "teal-light": "#00A3A3",
        },
        success: "#3E8A2E", // Sage Green
        warning: "#C8955A", // Burnt Orange for warnings
        error: "#8B4513", // Chocolate Brown for errors
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
