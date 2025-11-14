import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Authentic bakery colors
        'bakery-cream': '#FDF8F0',      // Warm cream color
        'bakery-brown': '#8B4513',      // Rich brown
        'bakery-gold': '#D4AF37',       // Golden wheat
        'bakery-rust': '#B8860B',       // Rustic orange-brown
        'bakery-sage': '#9CAF88',       // Sage green
        'bakery-charcoal': '#36454F',   // Charcoal gray
        'bakery-warm': '#F5E6D3',       // Warm beige
        'bakery-earth': '#6B4423',      // Earth brown
        'bakery-butter': '#F4E4BC',     // Butter yellow
        'bakery-cinnamon': '#D2691E',   // Cinnamon brown
        'bakery-primary': '#d45b04',    // Primary orange-brown
        'bakery-primary-dark': '#b84a03', // Darker primary for hover
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        // Authentic bakery fonts
        'bakery': ['Playfair Display', 'serif'],          // Elegant serif for headings
        'handwritten': ['Dancing Script', 'cursive'],     // Handwritten feel
        'rustic': ['Inter', 'sans-serif'],                // Clean, readable body text
        'artisan': ['Playfair Display', 'serif'],         // Artisan serif
      },
      boxShadow: {
        'bakery': '0 4px 6px rgba(139, 69, 19, 0.1), 0 2px 4px rgba(139, 69, 19, 0.06)',
        'bakery-hover': '0 10px 15px rgba(139, 69, 19, 0.1), 0 4px 6px rgba(139, 69, 19, 0.05)',
        'rustic': '0 2px 4px rgba(107, 68, 35, 0.15)',
      },
      backgroundImage: {
        'bakery-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23f5e6d3\" fill-opacity=\"0.4\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      animation: {
        'gentle-float': 'float 6s ease-in-out infinite',
        'warm-glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { filter: 'brightness(1)' },
          '100%': { filter: 'brightness(1.1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
