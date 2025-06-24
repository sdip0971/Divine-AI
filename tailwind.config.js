/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
          cormorant: ['var(--font-cormorant)', 'serif'],
          inter: ['var(--font-inter)', 'sans-serif'],
           geistSans: ['var(--font-geist-sans)', 'sans-serif'],
           geistMono: ['var(--font-geist-mono)', 'monospace'],
          hind: ['var(--font-hind)', 'sans-serif'],
          poppins: ['var(--font-poppins)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

