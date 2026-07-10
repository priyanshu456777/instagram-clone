/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Existing tokens — values refined for a richer, more premium dark
        // palette, but the keys are unchanged so every existing class
        // (bg-surface, text-accent, border-border, etc.) keeps working.
        base: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surface2: "rgb(var(--color-surface2) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        accent: "#8b5cf6",
        accentSoft: "#7c3aed",
        like: "#fb2c55",
        // New, additive tokens used only by the redesigned UI.
        accent2: "#ec4899",
        accent3: "#f97316",
        glass: "rgba(255,255,255,0.04)",
        glassBorder: "rgba(255,255,255,0.08)",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
        xl4: "2rem",
      },
      backgroundImage: {
        "gradient-premium": "linear-gradient(135deg, #8b5cf6 0%, #ec4899 55%, #f97316 100%)",
        "gradient-premium-soft": "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.18) 55%, rgba(249,115,22,0.18) 100%)",
        "gradient-radial-glow": "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.15), transparent 60%)",
      },
      boxShadow: {
        premium: "0 8px 30px rgba(0,0,0,0.35)",
        "premium-lg": "0 20px 60px rgba(0,0,0,0.45)",
        glow: "0 0 0 1px rgba(139,92,246,0.25), 0 8px 24px rgba(139,92,246,0.18)",
        "glow-like": "0 0 24px rgba(251,44,85,0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        popIn: {
          "0%": { transform: "scale(0.8)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 220ms ease-out",
        scaleIn: "scaleIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideUp: "slideUp 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideInRight: "slideInRight 260ms cubic-bezier(0.16, 1, 0.3, 1)",
        popIn: "popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};