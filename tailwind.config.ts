import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
        },
        // Secondary
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
          active: "var(--color-secondary-active)",
        },
        // Surface
        surface: {
          DEFAULT: "var(--color-surface)",
          container: "var(--color-surface-container)",
          "container-high": "var(--color-surface-container-high)",
          "container-highest": "var(--color-surface-container-highest)",
        },
        // Gray Scale
        gray: {
          900: "var(--color-gray-900)",
          700: "var(--color-gray-700)",
          500: "var(--color-gray-500)",
          300: "var(--color-gray-300)",
          100: "var(--color-gray-100)",
        },
        // Semantic Colors
        success: {
          DEFAULT: "var(--color-success)",
          hover: "var(--color-success-hover)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          hover: "var(--color-warning-hover)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          hover: "var(--color-danger-hover)",
        },
        // Text Colors
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        "text-disabled": "var(--color-text-disabled)",
        "text-on-primary": "var(--color-text-on-primary)",
        "text-on-secondary": "var(--color-text-on-secondary)",
        // Border Colors
        border: {
          DEFAULT: "var(--color-border)",
          hover: "var(--color-border-hover)",
          focus: "var(--color-border-focus)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      fontFamily: {
        sans: ["var(--font-family)", "sans-serif"],
      },
      fontSize: {
        h1: [
          "var(--text-h1-size)",
          {
            lineHeight: "var(--text-h1-line-height)",
            letterSpacing: "var(--text-h1-letter-spacing)",
            fontWeight: "var(--text-h1-weight)",
          },
        ],
        h2: [
          "var(--text-h2-size)",
          {
            lineHeight: "var(--text-h2-line-height)",
            letterSpacing: "var(--text-h2-letter-spacing)",
            fontWeight: "var(--text-h2-weight)",
          },
        ],
        h3: [
          "var(--text-h3-size)",
          {
            lineHeight: "var(--text-h3-line-height)",
            letterSpacing: "var(--text-h3-letter-spacing)",
            fontWeight: "var(--text-h3-weight)",
          },
        ],
        h4: [
          "var(--text-h4-size)",
          {
            lineHeight: "var(--text-h4-line-height)",
            letterSpacing: "var(--text-h4-letter-spacing)",
            fontWeight: "var(--text-h4-weight)",
          },
        ],
        h5: [
          "var(--text-h5-size)",
          {
            lineHeight: "var(--text-h5-line-height)",
            letterSpacing: "var(--text-h5-letter-spacing)",
            fontWeight: "var(--text-h5-weight)",
          },
        ],
        "body-l": [
          "var(--text-body-l-size)",
          {
            lineHeight: "var(--text-body-l-line-height)",
            letterSpacing: "var(--text-body-l-letter-spacing)",
            fontWeight: "var(--text-body-l-weight)",
          },
        ],
        "body-m": [
          "var(--text-body-m-size)",
          {
            lineHeight: "var(--text-body-m-line-height)",
            letterSpacing: "var(--text-body-m-letter-spacing)",
            fontWeight: "var(--text-body-m-weight)",
          },
        ],
        "body-s": [
          "var(--text-body-s-size)",
          {
            lineHeight: "var(--text-body-s-line-height)",
            letterSpacing: "var(--text-body-s-letter-spacing)",
            fontWeight: "var(--text-body-s-weight)",
          },
        ],
      },
      transitionDuration: {
        fast: "var(--motion-duration-fast)",
        normal: "var(--motion-duration-normal)",
      },
      transitionTimingFunction: {
        motion: "var(--motion-easing)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
