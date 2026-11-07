import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const envSchema = Type.Object({
  DATABASE_URL: Type.String({ pattern: "^(postgres://|postgresql://)" }),
});

type EnvSchemaType = Static<typeof envSchema>;

const data: Record<string, unknown> = { ...process.env };
Value.Default(envSchema, data);
Value.Convert(envSchema, data);

if (!Value.Check(envSchema, data)) {
  throw new Error("Invalid db env — set DATABASE_URL to a postgres URL");
}

export const env: EnvSchemaType = Value.Parse(envSchema, data);
