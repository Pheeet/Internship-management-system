import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F26522",
        header: "#6868ac",
        background: "#F3F4F6",
        surface: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
export default config;
