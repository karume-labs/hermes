import { type TSchema, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export const SeveritySchema = Type.Union([
  Type.Literal("Routine"),
  Type.Literal("Actionable"),
  Type.Literal("Urgent"),
]);

export const authHeaderSchema = Type.Object({
  authorization: Type.Optional(Type.String()),
});

export type ValidationIssue = { path: string; message: string };

/**
 * Shared client-side validation: the same schema the API validates with, run
 * locally so the mobile app can block a bad payload before the round trip.
 */
export const validatePayload = <T>(
  schema: TSchema,
  value: T,
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  for (const error of Value.Errors(schema, value)) {
    issues.push({
      path: error.path === "" ? "/" : error.path,
      message: error.message,
    });
  }
  return issues;
};

export const webEnvSchema = Type.Object({
  NEXT_PUBLIC_API_URL: Type.String({
    minLength: 1,
    error: "NEXT_PUBLIC_API_URL must point at the API origin.",
  }),
  NODE_ENV: Type.Optional(
    Type.Union([
      Type.Literal("development"),
      Type.Literal("production"),
      Type.Literal("test"),
    ]),
  ),
});

export type WebEnv = {
  NEXT_PUBLIC_API_URL: string;
  NODE_ENV: "development" | "production" | "test";
};

export const parseWebEnv = (input: {
  NEXT_PUBLIC_API_URL: string | undefined;
  NODE_ENV: string | undefined;
}): WebEnv => {
  const data = {
    NEXT_PUBLIC_API_URL: input.NEXT_PUBLIC_API_URL,
    NODE_ENV: input.NODE_ENV,
  };
  Value.Default(webEnvSchema, data);
  const issues = validatePayload(webEnvSchema, data);
  if (issues.length > 0) {
    throw new Error(
      `Invalid web env: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`,
    );
  }
  return {
    NEXT_PUBLIC_API_URL: String(data.NEXT_PUBLIC_API_URL),
    NODE_ENV:
      data.NODE_ENV === "production"
        ? "production"
        : data.NODE_ENV === "test"
          ? "test"
          : "development",
  };
};

export const mobileEnvSchema = Type.Object({
  EXPO_PUBLIC_API_BASE: Type.String({
    pattern: "^https?://",
    error: "EXPO_PUBLIC_API_BASE must start with http:// or https://.",
  }),
});
