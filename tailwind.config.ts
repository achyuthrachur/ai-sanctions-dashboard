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
        // BofA brand palette
        "boa-navy":      "#003571",
        "boa-blue":      "#0065B3",
        "boa-blue-light":"#E8F1F9",
        "boa-red":       "#E61030",
        "boa-red-light": "#FDEAED",
        "boa-red-dark":  "#B00D26",
        // Surface
        "surface-page":  "#F4F6F8",
        "surface-card":  "#FFFFFF",
        "surface-hover": "#F7F9FB",
        // Text
        "text-primary":  "#1A2332",
        "text-secondary":"#4A5568",
        "text-muted":    "#8A97A5",
        // Status semantic
        "status-green":  "#16A34A",
        "status-green-bg":"#F0FDF4",
        "status-amber":  "#D97706",
        "status-amber-bg":"#FFFBEB",
        "status-red":    "#E61030",
        "status-red-bg": "#FDEAED",
      },
      fontFamily: {
        sans:      ["IBM Plex Sans", "Segoe UI", "Arial", "Helvetica", "sans-serif"],
        condensed: ["IBM Plex Sans Condensed", "Arial Narrow", "Segoe UI", "sans-serif"],
        mono:      ["IBM Plex Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(230,16,48,0.5)" },
          "50%":       { boxShadow: "0 0 0 5px rgba(230,16,48,0)" },
        },
        "fade-in-down": {
          "0%":   { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "row-expand": {
          "0%":   { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-border":   "pulse-border 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in-down":   "fade-in-down 0.2s ease-out",
        "row-expand":     "row-expand 0.25s ease-out",
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-md":"0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
        "red-glow":"0 4px 12px rgba(230,16,48,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
