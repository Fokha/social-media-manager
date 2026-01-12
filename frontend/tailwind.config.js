/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Platform colors
        youtube: '#FF0000',
        instagram: '#E4405F',
        twitter: '#1DA1F2',
        linkedin: '#0A66C2',
        snapchat: '#FFFC00',
        whatsapp: '#25D366',
        telegram: '#0088CC',
        github: '#181717',
      },
    },
  },
  plugins: [],
}
