import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const envSchema = Type.Object({
  PORT: Type.String({ default: "8001" }),
  DATABASE_URL: Type.String({ default: "" }),
  API_SECRET: Type.String({ default: "dev-secret-change-me" }),
  API_URL: Type.String({ default: "http://localhost:18003" }),
  FRONTEND_URL: Type.String({ default: "http://localhost:3100" }),
  BETTER_AUTH_SECRET: Type.String({
    default: "hermes-development-secret-change-me-now",
  }),
  // Case files (lab reports, referral letters) are written to this directory on
  // the API server's own disk; no object storage is involved.
  UPLOAD_DIR: Type.String({ default: "uploads" }),
  // Optional outbound sink for patient notifications (email/SMS gateway URL).
  // Empty means "queue only": the outbox keeps rows for the admin to inspect.
  NOTIFY_WEBHOOK_URL: Type.String({ default: "" }),
  // Transactional SMS gateway for patient login codes. Receives
  // `{ to, text }` as JSON. Empty means codes are only returned in dev.
  SMS_WEBHOOK_URL: Type.String({ default: "" }),
  // HMAC secret every lab feed must sign with (x-hermes-signature).
  WEBHOOK_SECRET: Type.String({ default: "dev-webhook-secret-change-me" }),
  PATIENT_SESSION_DAYS: Type.String({ default: "30" }),
  PATIENT_CODE_TTL_MINUTES: Type.String({ default: "10" }),
  NODE_ENV: Type.Union(
    [
      Type.Literal("development"),
      Type.Literal("production"),
      Type.Literal("test"),
    ],
    { default: "development" },
  ),
});

type EnvSchemaType = Static<typeof envSchema>;

const data: Record<string, unknown> = { ...process.env };
Value.Default(envSchema, data);
Value.Convert(envSchema, data);

if (!Value.Check(envSchema, data)) {
  throw new Error(
    "Invalid API env — check PORT/DATABASE_URL/API_SECRET/NODE_ENV",
  );
}

export const env: EnvSchemaType = data as EnvSchemaType;

// Production must not run on any documented development default: a missing
// variable should fail the deploy, never silently point at localhost or sign
// sessions with a public string.
if (env.NODE_ENV === "production") {
  const unsafe: string[] = [];
  if (env.DATABASE_URL === "") unsafe.push("DATABASE_URL");
  if (env.API_SECRET === "dev-secret-change-me") unsafe.push("API_SECRET");
  if (
    env.BETTER_AUTH_SECRET === "hermes-development-secret-change-me-now" ||
    env.BETTER_AUTH_SECRET.length < 32
  ) {
    unsafe.push("BETTER_AUTH_SECRET");
  }
  if (env.WEBHOOK_SECRET === "dev-webhook-secret-change-me") {
    unsafe.push("WEBHOOK_SECRET");
  }
  if (env.API_URL.includes("localhost")) unsafe.push("API_URL");
  if (env.FRONTEND_URL.includes("localhost")) unsafe.push("FRONTEND_URL");
  if (!env.API_URL.startsWith("https://")) unsafe.push("API_URL (https)");
  if (!env.FRONTEND_URL.startsWith("https://")) {
    unsafe.push("FRONTEND_URL (https)");
  }
  if (unsafe.length > 0) {
    throw new Error(
      `Refusing to start in production with unsafe env: ${unsafe.join(", ")}`,
    );
  }
}
