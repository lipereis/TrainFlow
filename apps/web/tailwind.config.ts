import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        mkt: {
          accent: "hsl(var(--mkt-accent) / <alpha-value>)",
          "accent-fg": "hsl(var(--mkt-accent-foreground) / <alpha-value>)",
          glow: "hsl(var(--mkt-glow) / <alpha-value>)",
          dark: "hsl(var(--mkt-dark) / <alpha-value>)",
          "dark-surface": "hsl(var(--mkt-dark-surface) / <alpha-value>)",
          "dark-border": "hsl(var(--mkt-dark-border) / <alpha-value>)",
          "dark-muted": "hsl(var(--mkt-dark-muted) / <alpha-value>)",
          light: "hsl(var(--mkt-light) / <alpha-value>)",
          "light-muted": "hsl(var(--mkt-light-muted) / <alpha-value>)",
          "light-fg": "hsl(var(--mkt-light-fg) / <alpha-value>)",
          "light-muted-fg": "hsl(var(--mkt-light-muted-fg) / <alpha-value>)",
        },
      },
      borderRadius: {
        xl: "var(--radius)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
