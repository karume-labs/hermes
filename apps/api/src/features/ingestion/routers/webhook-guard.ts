import type { WebhookSource } from "@api/features/ingestion/services/webhook-auth";
import {
  releaseWebhook,
  verifyWebhook,
} from "@api/features/ingestion/services/webhook-auth";
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

/**
 * Verify, run, and on failure give the signature back. A rejected signature is
 * never claimed; a claimed one is only kept once its payload is stored, so a
 * retry after a transient failure is processed instead of answered 409.
 */
export const withWebhook = async <T>(
  source: WebhookSource,
  request: Request,
  handle: () => Promise<T>,
): Promise<T> => {
  try {
    await verifyWebhook(request, source);
  } catch (error) {
    await logFailure(source, error);
    throw error;
  }
  try {
    return await handle();
  } catch (error) {
    await releaseWebhook(request, source);
    await logFailure(source, error);
    throw error;
  }
};

export const webhookSourceFor = (path: string): string | null => {
  if (path === "/webhooks/lab") return "lab";
  if (path === "/webhooks/fhir") return "fhir";
  if (path === "/webhooks/hl7") return "hl7";
  return null;
};
