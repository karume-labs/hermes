// process.env is confined here; everything else imports validated `env`.
const rawBase = process.env.EXPO_PUBLIC_API_BASE;

export const env = {
  apiBase:
    rawBase === undefined || rawBase === "" ? "http://localhost:8001" : rawBase,
};
