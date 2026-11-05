// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // The deployed origin feeds every canonical and share URL. It must stay in
  // sync with SITE_URL in src/lib/constants.ts.
  site: "https://hermes.karume.one",
  server: { port: 4322 },
  vite: { plugins: [tailwindcss()] },
});
