/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // AgriVoice brand palette — earthy greens and warm amber
        primary: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#2d6a4f",  // main brand green
          600: "#1b5e3b",
          700: "#145230",
          800: "#0f3d24",
          900: "#052e16",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        soil: "#7c4b1e",
        sky:  "#38bdf8",
      },
      fontSize: {
        // Minimum 18pt for low-literacy UI
        base: ["18px", { lineHeight: "28px" }],
        lg:   ["20px", { lineHeight: "30px" }],
        xl:   ["24px", { lineHeight: "34px" }],
        "2xl":["28px", { lineHeight: "38px" }],
        "3xl":["32px", { lineHeight: "44px" }],
      },
      spacing: {
        // Larger touch targets (min 48px per WCAG)
        touch: "48px",
        "touch-lg": "64px",
      },
    },
  },
  plugins: [],
};
