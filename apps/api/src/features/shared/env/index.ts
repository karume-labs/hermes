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
  // Google OAuth is optional; sign-in falls back to email + password when unset.
  GOOGLE_CLIENT_ID: Type.String({ default: "" }),
  GOOGLE_CLIENT_SECRET: Type.String({ default: "" }),
  // Optional outbound sink for patient notifications (email/SMS gateway URL).
  // Empty means "queue only": the outbox keeps rows for the admin to inspect.
  NOTIFY_WEBHOOK_URL: Type.String({ default: "" }),
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

// Refuse to boot production with the documented development secret.
if (
  env.NODE_ENV === "production" &&
  env.API_SECRET === "dev-secret-change-me"
) {
  throw new Error("API_SECRET must be set in production");
}
