import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: [
    "./**/*.{ts,tsx}",
  ],
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark"],
  },
} satisfies Config;
