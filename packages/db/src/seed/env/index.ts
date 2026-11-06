import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const seedEnvSchema = Type.Object({
  DATABASE_URL: Type.String({
    minLength: 1,
    error: "DATABASE_URL is required",
  }),
  BETTER_AUTH_SECRET: Type.String({
    default: "hermes-development-secret-change-me-now",
  }),
  API_URL: Type.String({ default: "http://localhost:18003" }),
  COORDINATOR_EMAIL: Type.String({
    default: "coordinator@hermescare.test",
  }),
  COORDINATOR_PASSWORD: Type.String({ default: "hermes-care" }),
  ADMIN_EMAIL: Type.String({ default: "admin@hermescare.test" }),
  ADMIN_PASSWORD: Type.String({ default: "hermes-care" }),
});

type SeedEnv = Static<typeof seedEnvSchema>;

let cached: SeedEnv | null = null;

const resolveEnv = (): SeedEnv => {
  if (cached !== null) return cached;
  const data: Record<string, unknown> = { ...process.env };
  Value.Default(seedEnvSchema, data);
  Value.Convert(seedEnvSchema, data);
  if (!Value.Check(seedEnvSchema, data)) {
    const message = [...Value.Errors(seedEnvSchema, data)]
      .map((error) => error.message)
      .join("; ");
    throw new Error(`Invalid seed env: ${message}`);
  }
  cached = data as SeedEnv;
  return cached;
};

export const seedEnv: SeedEnv = new Proxy({} as SeedEnv, {
  get: (_, key: string) => resolveEnv()[key as keyof SeedEnv],
});
