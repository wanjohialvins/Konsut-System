/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}", // cover TypeScript files
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        softgray: "#f8fafc",
        accentblue: "#0099ff",
        // Midnight Shadows Palette
        midnight: {
          950: "#1A1A2E", // Main Background (Deepest Navy)
          900: "#16213E", // Sidebar / Header (Dark Blue)
          800: "#0F3460", // Cards / Panels (Blue 2)
          700: "#243b55", // Borders (Computed, or use 800 lighten)
          text: {
            primary: "#F9F9F9", // Crisp White
            secondary: "#B0B0B0", // Soft Gray (Provided previously, keeping for hierarchy)
            muted: "#6B7280"
          },
          accent: "#E94560" // Vibrant Red
        },
        brand: {
          DEFAULT: "var(--brand-primary)",
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        }
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
