/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./app/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 20px 50px -30px rgba(15, 23, 42, 0.45)",
      },
    },
  },
  plugins: [],
};
