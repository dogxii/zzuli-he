/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        'sys-light': '#F1F5F9', // Crisp light background (Slate 50)
        'sys-light-card': '#FFFFFF',
        'sys-dark': '#0B1120', // Deep sci-fi black/navy
        'sys-dark-card': '#151D2E', // Slightly lighter dark panel
        
        'sys-accent': '#00AEEF', // Bright cyan (Blue Archive / Rhodes Island style)
        'sys-accent-dark': '#00C3FF', 
        
        'sys-border': '#E2E8F0', // Slate 200
        'sys-border-dark': '#1E293B', // Slate 800
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glitch": "glitch 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glitch: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
          "52%": { opacity: "1", transform: "translateX(2px)" },
          "54%": { transform: "translateX(0)" },
        }
      },
    },
  },
  plugins: [],
};
