import type { Config } from "tailwindcss";
import { umbrisTheme } from "@umbris/design/tailwind";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "../packages/umbris-design/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: umbrisTheme,
  },
  plugins: [],
};

export default config;
