import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { notifications, webhookLogs } from "@db/notify/schema/index";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { inArray } from "drizzle-orm";
import data from "./data.json";

const NotificationFixture = Type.Object({
  slug: Type.String(),
  channel: Type.Union([
    Type.Literal("push"),
    Type.Literal("sms"),
    Type.Literal("email"),
    Type.Literal("in_app"),
  ]),
  kind: Type.Union([
    Type.Literal("case_alert"),
    Type.Literal("sms_fallback"),
    Type.Literal("escalation"),
    Type.Literal("secure_message"),
    Type.Literal("visit_reminder"),
  ]),
  status: Type.Union([
    Type.Literal("queued"),
    Type.Literal("sent"),
    Type.Literal("delivered"),
    Type.Literal("read"),
    Type.Literal("failed"),
  ]),
  minutesAfterCase: Type.Number(),
  readMinutesAfterCase: Type.Optional(Type.Number()),
  attempts: Type.Number(),
  error: Type.Optional(Type.String()),
  nextAttemptMinutes: Type.Optional(Type.Number()),
  payload: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

const WebhookFixture = Type.Object({
  source: Type.String(),
  ok: Type.Boolean(),
  status: Type.String(),
  hoursAgo: Type.Number(),
  detail: Type.Record(Type.String(), Type.Unknown()),
});

const fixtures = Value.Parse(
  Type.Array(NotificationFixture),
  data.notifications,
);
const webhooks = Value.Parse(Type.Array(WebhookFixture), data.webhooks);

const minutes = (value: number): number => value * 60 * 1000;

// Alerts stay deliberately content-free: the result itself is only ever read
// inside the app, never inside a push payload or an SMS body.
const defaultPayload = { title: "New screening result", secure: true };

export const seedNotify = async (context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: notifications.id })
    .from(notifications)
    .limit(1);
  if (existing.length > 0) return 0;

  const slugs = [...new Set(fixtures.map((fixture) => `seed-${fixture.slug}`))];
  const cases = await db
    .select({
      id: careCases.id,
      patientId: careCases.patientId,
      labPayloadId: careCases.labPayloadId,
      createdAt: careCases.createdAt,
    })
    .from(careCases)
    .where(inArray(careCases.labPayloadId, slugs));
  if (cases.length === 0) return 0;

  const caseBySlug = new Map(
    cases.map((row) => [row.labPayloadId.replace(/^seed-/, ""), row]),
  );

  const rows = fixtures.flatMap((fixture) => {
    const careCase = caseBySlug.get(fixture.slug);
    if (careCase === undefined) return [];
    const sentAt = new Date(
      careCase.createdAt.getTime() + minutes(fixture.minutesAfterCase),
    );
    return [
      {
        caseId: careCase.id,
        patientId: careCase.patientId,
        channel: fixture.channel,
        kind: fixture.kind,
        status: fixture.status,
        payload: fixture.payload ?? defaultPayload,
        attempts: fixture.attempts,
        error: fixture.error ?? null,
        sentAt:
          fixture.status === "queued" || fixture.status === "failed"
            ? null
            : sentAt,
        readAt:
          fixture.readMinutesAfterCase === undefined
            ? null
            : new Date(
                careCase.createdAt.getTime() +
                  minutes(fixture.readMinutesAfterCase),
              ),
        nextAttemptAt:
          fixture.nextAttemptMinutes === undefined
            ? null
            : new Date(
                context.now.getTime() + minutes(fixture.nextAttemptMinutes),
              ),
        createdAt: sentAt,
      },
    ];
  });

  if (rows.length > 0) await db.insert(notifications).values(rows);
  if (webhooks.length > 0) {
    await db.insert(webhookLogs).values(
      webhooks.map((entry) => ({
        source: entry.source,
        ok: entry.ok,
        status: entry.status,
        detail: entry.detail,
        createdAt: new Date(
          context.now.getTime() - entry.hoursAgo * 3600 * 1000,
        ),
      })),
    );
  }
  return rows.length + webhooks.length;
};
