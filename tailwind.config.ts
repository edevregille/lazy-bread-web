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
        // Clean, modern bakery colors
        'bakery-cream': '#FAF8F5',      // Soft cream
        'bakery-brown': '#5C4A3A',      // Refined brown
        'bakery-gold': '#C9A961',       // Soft golden
        'bakery-rust': '#9A6B5A',       // Muted terracotta
        'bakery-sage': '#9CAF88',        // Sage green
        'bakery-charcoal': '#1F1F1F',    // Dark charcoal
        'bakery-warm': '#F5F3F0',       // Warm beige
        'bakery-earth': '#5C4A3A',       // Earth brown
        'bakery-butter': '#F5F3F0',     // Soft butter
        'bakery-cinnamon': '#8B7D6B',   // Muted cinnamon
        'bakery-primary': '#B87D6A',    // Soft terracotta primary
        'bakery-primary-dark': '#9A6B5A', // Darker primary for hover
        'bakery-primary-light': '#D4A799', // Lighter primary
        'gray-light': '#F7F7F7',
        'gray-medium': '#E5E5E5',
        'gray-dark': '#6B6B6B',
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
        'bakery': '0 2px 8px rgba(31, 31, 31, 0.08), 0 1px 3px rgba(31, 31, 31, 0.05)',
        'bakery-hover': '0 4px 12px rgba(31, 31, 31, 0.12), 0 2px 6px rgba(31, 31, 31, 0.08)',
        'rustic': '0 1px 3px rgba(92, 74, 58, 0.12)',
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
