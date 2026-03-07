import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00f5ff",
          50: "#e0fffe",
          100: "#b3fffe",
          200: "#80fffd",
          300: "#4dfffc",
          400: "#26f9fb",
          500: "#00f5ff",
          600: "#00c4cc",
          700: "#009299",
          800: "#006166",
          900: "#003033",
        },
        secondary: {
          DEFAULT: "#7c3aed",
          50: "#f5f0ff",
          100: "#ede3ff",
          200: "#dac9ff",
          300: "#c3a3ff",
          400: "#a872fe",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#2e1065",
        },
        accent: {
          DEFAULT: "#f0abfc",
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
        },
        neon: {
          cyan: "#00f5ff",
          purple: "#7c3aed",
          pink: "#f0abfc",
          green: "#00ff88",
          yellow: "#ffff00",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.05)",
          border: "rgba(255,255,255,0.1)",
          hover: "rgba(255,255,255,0.08)",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
        "neon-gradient":
          "linear-gradient(135deg, #00f5ff 0%, #7c3aed 50%, #f0abfc 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a0f 100%)",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,245,255,0.5), 0 0 40px rgba(0,245,255,0.3)",
        "neon-purple": "0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.3)",
        "neon-pink": "0 0 20px rgba(240,171,252,0.5), 0 0 40px rgba(240,171,252,0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-lg": "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "gradient-shift": "gradientShift 8s ease infinite",
        "scan-line": "scanLine 3s linear infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        neonPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,245,255,0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(0,245,255,0.9), 0 0 80px rgba(0,245,255,0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          from: { textShadow: "0 0 10px rgba(0,245,255,0.5)" },
          to: { textShadow: "0 0 20px rgba(0,245,255,1), 0 0 40px rgba(0,245,255,0.5)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
