import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgba(148, 163, 184, 0.18)",
        background: "#020617",
        foreground: "#e2e8f0",
        muted: "#0f172a",
        primary: "#22d3ee",
        ring: "#38bdf8"
      },
      boxShadow: {
        neon: "0 0 30px rgba(34, 211, 238, 0.28)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 70px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        "radial-ocean": "radial-gradient(circle at top left, rgba(34,211,238,0.18), transparent 30%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #07111f 45%, #031525 100%)"
      }
    }
  },
  plugins: [animate]
};

export default config;

