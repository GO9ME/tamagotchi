import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        ink: "#3B2F2A",
        blush: "#FFB7C5",
        mint: "#A8E6CF",
        sky: "#AEDFF7",
        butter: "#FFE3A3",
        grape: "#C9B6F2",
        coral: "#FF9A8B",
      },
      fontFamily: {
        rounded: [
          "var(--font-rounded)",
          "ui-rounded",
          "Apple SD Gothic Neo",
          "Pretendard",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        toy: "0 8px 0 0 rgba(0,0,0,0.08), 0 14px 24px -10px rgba(0,0,0,0.25)",
        soft: "0 10px 30px -12px rgba(0,0,0,0.25)",
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        bob: "bob 2.8s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        pop: "pop 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
