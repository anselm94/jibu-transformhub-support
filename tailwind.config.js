/** @type {import('tailwindcss').Config} */
export default {
  presets: [require("frappe-ui/src/tailwind/preset.js")],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
