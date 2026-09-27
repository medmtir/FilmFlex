import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        filmflex: {
          red: "#E50914",
          darkRed: "#990000",
          crimson: "#6b0000",
          black: "#0b0b0b",
          dark: "#141414",
          card: "#181818",
          cardHover: "#232323",
          border: "#2f2f2f",
          muted: "#8c8c8c",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-up": "scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "intro-pulse": "introPulse 2.5s ease-in-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        introPulse: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "40%": { transform: "scale(1.05)", opacity: "1" },
          "70%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.2)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
