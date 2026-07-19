import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cyprus: "#004741",
        sand: "#F0EDE4",
        border: "#D9D4C8",
        background: "#F8F6F0",
        foreground: "#102A27",
        muted: "#F0EDE4",
        "muted-foreground": "#65736F",
        primary: "#004741",
        "primary-foreground": "#FFFFFF",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(0, 71, 65, 0.10)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
