import { db } from "@db/client";
import { deviceTokens, mobileEvents } from "@db/patient/schema/index";
import type { MobileEventType } from "@hermes/types";

export const registerDevice = async (input: {
  patientId: string;
  token: string;
  platform: string;
}): Promise<void> => {
  await db
    .insert(deviceTokens)
    .values(input)
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: {
        patientId: input.patientId,
        platform: input.platform,
        lastSeenAt: new Date(),
      },
    });
};

export const recordMobileEvent = async (input: {
  patientId: string;
  caseId?: string | null;
  type: MobileEventType;
}): Promise<void> => {
  await db.insert(mobileEvents).values({
    patientId: input.patientId,
    caseId: input.caseId,
    type: input.type,
  });
};

export const listMobileEvents = async (since: Date) => {
  const rows = await db.select().from(mobileEvents);
  return rows.filter((row) => row.createdAt >= since);
};
