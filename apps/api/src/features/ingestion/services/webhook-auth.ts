import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@api/features/shared/env/index";
import {
  ConflictError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { webhookReceipts } from "@db/notify/schema/index";
import { lt } from "drizzle-orm";

export type WebhookSource = "lab" | "fhir" | "hl7";

// The raw JSON text is what the lab signs; Elysia hands handlers a parsed body,
// so the parse hook leaves the original bytes here for verification.
const rawBodies = new WeakMap<Request, string>();

export const rememberRawBody = (request: Request, raw: string): void => {
  rawBodies.set(request, raw);
};

const equal = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const MAX_SKEW_SECONDS = 300;

/**
 * HMAC-SHA256 over `<timestamp>.<raw body>`, sent as
 * `x-hermes-timestamp` (unix seconds) and `x-hermes-signature: sha256=<hex>`.
 * The signature is single-use: its hash is recorded, so a captured request
 * cannot be replayed inside the five-minute window.
 */
export const verifyWebhook = async (
  request: Request,
  source: WebhookSource,
): Promise<void> => {
  const raw = rawBodies.get(request);
  if (raw === undefined) throw new UnauthorizedError("Missing request body");

  const timestamp = request.headers.get("x-hermes-timestamp");
  const signature = request.headers.get("x-hermes-signature");
  if (timestamp === null || signature === null) {
    throw new UnauthorizedError("Missing webhook signature");
  }

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) {
    throw new UnauthorizedError("Invalid webhook timestamp");
  }
  const skew = Math.abs(Date.now() / 1000 - seconds);
  if (skew > MAX_SKEW_SECONDS) {
    throw new UnauthorizedError("Webhook timestamp has expired");
  }

  const provided = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;
  const expected = createHmac("sha256", env.WEBHOOK_SECRET)
    .update(`${timestamp}.${raw}`)
    .digest("hex");
  if (!equal(provided, expected)) {
    throw new UnauthorizedError("Invalid webhook signature");
  }

  const receiptId = createHash("sha256")
    .update(`${source}:${signature}`)
    .digest("hex");
  const [inserted] = await db
    .insert(webhookReceipts)
    .values({ id: receiptId, source })
    .onConflictDoNothing()
    .returning({ id: webhookReceipts.id });
  if (inserted === undefined) {
    throw new ConflictError("Webhook already processed");
  }
};

export const pruneWebhookReceipts = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db
    .delete(webhookReceipts)
    .where(lt(webhookReceipts.receivedAt, cutoff));
};
