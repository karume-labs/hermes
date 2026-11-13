// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // The deployed origin feeds every canonical and share URL. It must stay in
  // sync with SITE_URL in src/lib/constants.ts.
  site: "https://hermes.karume.one",
  server: { port: 4322 },
  // The schema default is the only place the local dashboard URL lives; pages
  // read the guaranteed value instead of adding `?? "http://localhost..."`.
  env: {
    schema: {
      PUBLIC_DASHBOARD_URL: envField.string({
        context: "client",
        access: "public",
        default: "http://localhost:3100",
      }),
    },
  },
  vite: { plugins: [tailwindcss()] },
});
