/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Origin of the clinic dashboard; falls back to the local dev server. */
  readonly PUBLIC_DASHBOARD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
