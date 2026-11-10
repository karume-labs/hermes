import { afterAll, describe, expect, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";
import {
  bodyDigest,
  releaseWebhook,
  rememberRawBody,
  verifyWebhook,
  type WebhookSource,
} from "@api/features/ingestion/services/webhook-auth";
import { env } from "@api/features/shared/env/index";
import { db } from "@db/client";
import { webhookReceipts } from "@db/notify/schema/index";
import { inArray } from "drizzle-orm";

const signedRequest = (
  source: WebhookSource,
  raw: string,
): { request: Request; receiptId: string } => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `sha256=${createHmac("sha256", env.WEBHOOK_SECRET)
    .update(`${timestamp}.${raw}`)
    .digest("hex")}`;
  const request = new Request(`http://localhost/webhooks/${source}`, {
    method: "POST",
    headers: {
      "x-hermes-timestamp": timestamp,
      "x-hermes-signature": signature,
    },
    body: raw,
  });
  rememberRawBody(request, raw);
  const receiptId = createHash("sha256")
    .update(`${source}:${signature}`)
    .digest("hex");
  return { request, receiptId };
};

const raw = JSON.stringify({
  patientId: "patient-1-clinic-1",
  markerCode: "glucose",
  markerValue: 210,
  unit: "mg/dL",
  takenAt: "2026-11-10T09:00:00.000Z",
});

const cleanupIds: string[] = [];

afterAll(async () => {
  if (cleanupIds.length > 0) {
    await db
      .delete(webhookReceipts)
      .where(inArray(webhookReceipts.id, cleanupIds));
  }
});

describe("webhook signature claims", () => {
  test("a signed body is claimed once", async () => {
    const { request, receiptId } = signedRequest("lab", raw);
    cleanupIds.push(receiptId);
    await verifyWebhook(request, "lab");
    expect(bodyDigest(request)).toHaveLength(64);
    await expect(verifyWebhook(request, "lab")).rejects.toThrow(
      "Webhook already processed",
    );
  });

  test("a released claim can be retried, so a failed ingest is not lost", async () => {
    const { request, receiptId } = signedRequest("lab", `${raw}retry`);
    cleanupIds.push(receiptId);
    await verifyWebhook(request, "lab");
    await releaseWebhook(request, "lab");
    // The same payload verifies again because storing it failed upstream.
    await verifyWebhook(request, "lab");
    // ...and once stored it is claimed for good.
    await expect(verifyWebhook(request, "lab")).rejects.toThrow(
      "Webhook already processed",
    );
  });

  test("an unsigned body is refused and leaves no claim", async () => {
    const request = new Request("http://localhost/webhooks/lab", {
      method: "POST",
      body: raw,
    });
    rememberRawBody(request, raw);
    await expect(verifyWebhook(request, "lab")).rejects.toThrow(
      "Missing webhook signature",
    );
  });
});
