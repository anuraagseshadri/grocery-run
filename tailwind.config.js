/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#176a21",
        "primary-dim": "#025d16",
        "primary-container": "#9df197",
        "on-primary-container": "#005c15",
        "secondary": "#874e00",
        "secondary-container": "#ffc791",
        "secondary-dim": "#764400",
        "tertiary": "#005e9f",
        "tertiary-container": "#70b5ff",
        "tertiary-dim": "#00528b",
        "error": "#b02500",
        "error-container": "#f95630",
        "background": "#f2f9ea",
        "surface": "#f2f9ea",
        "surface-bright": "#f2f9ea",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ebf3e3",
        "surface-container": "#e2ebda",
        "surface-container-high": "#dce6d4",
        "surface-container-highest": "#d6e0cd",
        "surface-variant": "#d6e0cd",
        "on-surface": "#2a3127",
        "on-surface-variant": "#575e52",
        "outline": "#72796d",
        "outline-variant": "#a8afa2",
      },
      borderRadius: {
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["'Plus Jakarta Sans'", "sans-serif"],
        "display": ["'Plus Jakarta Sans'", "sans-serif"],
        "body": ["'Be Vietnam Pro'", "sans-serif"],
        "label": ["'Plus Jakarta Sans'", "sans-serif"]
      }
    }
  },
  plugins: [],
}