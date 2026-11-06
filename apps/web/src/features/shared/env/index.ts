import { parseWebEnv } from "@hermes/validators";

// process.env is confined to this module; everything else imports `env`.
export const env = parseWebEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
});
