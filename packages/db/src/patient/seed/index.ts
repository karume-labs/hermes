import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import {
  caseMessages,
  deviceTokens,
  mobileEvents,
} from "@db/patient/schema/index";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { inArray } from "drizzle-orm";
import data from "./data.json";

const DeviceSeed = Type.Object({
  patientId: Type.String(),
  token: Type.String(),
  platform: Type.String(),
  lastSeenHoursAgo: Type.Number(),
});

const MessageSeed = Type.Object({
  slug: Type.String(),
  sender: Type.Union([Type.Literal("patient"), Type.Literal("coordinator")]),
  senderId: Type.String(),
  body: Type.String(),
  hoursAfterCase: Type.Number(),
  read: Type.Boolean(),
});

const EventSeed = Type.Object({
  patientId: Type.String(),
  slug: Type.Optional(Type.String()),
  type: Type.Union([
    Type.Literal("app_open"),
    Type.Literal("push_opened"),
    Type.Literal("case_viewed"),
    Type.Literal("booking_confirmed"),
    Type.Literal("message_sent"),
  ]),
  hoursAgo: Type.Number(),
});

const devices = Value.Parse(Type.Array(DeviceSeed), data.devices);
const messages = Value.Parse(Type.Array(MessageSeed), data.messages);
const events = Value.Parse(Type.Array(EventSeed), data.events);

const hours = (value: number): number => value * 3600 * 1000;

const loadCases = async (slugs: string[]) => {
  const unique = [...new Set(slugs.map((slug) => `seed-${slug}`))];
  const rows = await db
    .select({
      id: careCases.id,
      patientId: careCases.patientId,
      labPayloadId: careCases.labPayloadId,
      createdAt: careCases.createdAt,
    })
    .from(careCases)
    .where(inArray(careCases.labPayloadId, unique));
  return new Map(
    rows.map((row) => [row.labPayloadId.replace(/^seed-/, ""), row]),
  );
};

// Idempotent: bails once a thread exists so `db:seed` is safe to rerun.
export const seedPatient = async (context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: caseMessages.id })
    .from(caseMessages)
    .limit(1);
  if (existing.length > 0) return 0;

  const caseBySlug = await loadCases(messages.map((message) => message.slug));
  const messageRows = messages.flatMap((message) => {
    const careCase = caseBySlug.get(message.slug);
    if (careCase === undefined) return [];
    const createdAt = new Date(
      careCase.createdAt.getTime() + hours(message.hoursAfterCase),
    );
    return [
      {
        caseId: careCase.id,
        sender: message.sender,
        senderId: message.senderId,
        body: message.body,
        readAt: message.read
          ? new Date(createdAt.getTime() + 5 * 60 * 1000)
          : null,
        createdAt,
      },
    ];
  });

  if (messageRows.length > 0) await db.insert(caseMessages).values(messageRows);

  await db
    .insert(deviceTokens)
    .values(
      devices.map((device) => ({
        patientId: device.patientId,
        token: device.token,
        platform: device.platform,
        lastSeenAt: new Date(
          context.now.getTime() - hours(device.lastSeenHoursAgo),
        ),
      })),
    )
    .onConflictDoNothing();

  const eventCaseBySlug = await loadCases(
    events.flatMap((event) => (event.slug === undefined ? [] : [event.slug])),
  );
  const eventRows = events.map((event) => ({
    patientId: event.patientId,
    caseId:
      event.slug === undefined
        ? null
        : (eventCaseBySlug.get(event.slug)?.id ?? null),
    type: event.type,
    createdAt: new Date(context.now.getTime() - hours(event.hoursAgo)),
  }));
  if (eventRows.length > 0) await db.insert(mobileEvents).values(eventRows);

  return messageRows.length + devices.length + eventRows.length;
};
