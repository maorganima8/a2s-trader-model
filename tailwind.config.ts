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
        "on-surface-variant": "#4f4633",
        "secondary": "#5e5e5e",
        "outline-variant": "#d3c5ad",
        "on-primary": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "on-surface": "#1c1b1b",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#dcd9d9",
        "surface-container": "#f0edec",
        "primary-container": "#fbc02d",
        "on-primary-container": "#6c5000",
        "primary": "#795900",
        "surface": "#fcf9f8",
        "outline": "#817661",
        "surface-container-high": "#ebe7e7",
        "surface-container-highest": "#e5e2e1",
        "secondary-container": "#e2e2e2",
        "background": "#fcf9f8",
        "tertiary": "#00687b",
        "on-tertiary": "#ffffff",
        "surface-variant": "#e5e2e1",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
