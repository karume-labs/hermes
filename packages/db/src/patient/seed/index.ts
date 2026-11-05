import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { caseMessages, deviceTokens } from "@db/patient/schema/index";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import data from "./data.json";

const PatientSeed = Type.Object({
  messages: Type.Array(
    Type.Object({
      sender: Type.Union([
        Type.Literal("patient"),
        Type.Literal("coordinator"),
      ]),
      body: Type.String(),
    }),
  ),
  demoDeviceToken: Type.String(),
});

const parsed = Value.Parse(PatientSeed, data);

// Seeds a coordinator thread on the first escalated case plus one demo device
// so the admin delivery panel has a real push target to show.
export const seedPatient = async (_context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: caseMessages.id })
    .from(caseMessages)
    .limit(1);
  if (existing.length > 0) return 0;

  const cases = await db.select().from(careCases);
  if (cases.length === 0) return 0;

  const target =
    cases.find((careCase) => careCase.status === "escalated") ?? cases[0];
  const messages = parsed.messages.map((message) => ({
    caseId: target.id,
    sender: message.sender,
    senderId:
      message.sender === "coordinator" ? "coordinator-1" : target.patientId,
    body: message.body,
  }));

  await db.insert(caseMessages).values(messages);
  await db
    .insert(deviceTokens)
    .values({
      patientId: target.patientId,
      token: parsed.demoDeviceToken,
      platform: "ios",
    })
    .onConflictDoNothing();
  return messages.length + 1;
};
