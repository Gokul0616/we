/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#8B5CF6",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        border: "#E2E8F0",
        textPrimary: "#171717",
        textSecondary: "#737373",
      },
    },
  },
  plugins: [],
};
