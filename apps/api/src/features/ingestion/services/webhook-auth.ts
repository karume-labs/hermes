import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@api/features/shared/env/index";
import {
  ConflictError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { webhookReceipts } from "@db/notify/schema/index";
import { eq, lt } from "drizzle-orm";

export type WebhookSource = "lab" | "fhir" | "hl7";

// The raw JSON text is what the lab signs; Elysia hands handlers a parsed body,
// so the parse hook leaves the original bytes here for verification.
const rawBodies = new WeakMap<Request, string>();

export const rememberRawBody = (request: Request, raw: string): void => {
  rawBodies.set(request, raw);
};

/**
 * Stable identity for a signed payload, used when the feed does not carry its
 * own message id: a retry of the same body must resolve to the same case
 * instead of creating a second one.
 */
export const bodyDigest = (request: Request): string =>
  createHash("sha256")
    .update(rawBodies.get(request) ?? "")
    .digest("hex");

const equal = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const MAX_SKEW_SECONDS = 300;

const receiptIdFor = (source: WebhookSource, signature: string): string =>
  createHash("sha256").update(`${source}:${signature}`).digest("hex");

/**
 * HMAC-SHA256 over `<timestamp>.<raw body>`, sent as
 * `x-hermes-timestamp` (unix seconds) and `x-hermes-signature: sha256=<hex>`.
 *
 * The signature is claimed here so a captured request cannot be replayed
 * inside the five-minute window, but the claim is released by
 * `releaseWebhook` when processing fails: otherwise a transient database
 * error would burn the signature and every retry would answer 409, losing the
 * result. Only a payload that was actually ingested stays claimed.
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

  const receiptId = receiptIdFor(source, signature);
  const [inserted] = await db
    .insert(webhookReceipts)
    .values({ id: receiptId, source })
    .onConflictDoNothing()
    .returning({ id: webhookReceipts.id });
  if (inserted === undefined) {
    throw new ConflictError("Webhook already processed");
  }
};

/**
 * Gives the signature back when the handler could not store the result, so
 * the sender's retry is processed instead of being rejected as a duplicate.
 */
export const releaseWebhook = async (
  request: Request,
  source: WebhookSource,
): Promise<void> => {
  const signature = request.headers.get("x-hermes-signature");
  if (signature === null) return;
  await db
    .delete(webhookReceipts)
    .where(eq(webhookReceipts.id, receiptIdFor(source, signature)));
};

export const pruneWebhookReceipts = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db
    .delete(webhookReceipts)
    .where(lt(webhookReceipts.receivedAt, cutoff));
};
