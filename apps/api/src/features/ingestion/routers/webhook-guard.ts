import { recordWebhook } from "@api/features/notify/services/notification-webhooks";
import { Type } from "@sinclair/typebox";

export const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const logFailure = async (source: string, error: unknown) => {
  await recordWebhook(source, false, "rejected", {
    error: error instanceof Error ? error.message : "unknown",
  });
};

// TypeBox validation errors carry a short `summary`; the raw message is a JSON
// dump, which is unreadable in the admin audit table.
export const validationMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return "Schema validation failed";
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (typeof parsed === "object" && parsed !== null && "summary" in parsed) {
      const summary = parsed.summary;
      if (typeof summary === "string") return summary;
    }
  } catch {
    // Not the JSON envelope Elysia uses — fall through to the raw message.
  }
  return error.message.slice(0, 300);
};

export const webhookSourceFor = (path: string): string | null => {
  if (path === "/webhooks/lab") return "lab";
  if (path === "/webhooks/fhir") return "fhir";
  if (path === "/webhooks/hl7") return "hl7";
  return null;
};
