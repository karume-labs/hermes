import { ensureSlots } from "@api/features/booking/services/slot-service";
import {
  generateSessionToken,
  hashToken,
} from "@api/features/patient-auth/services/tokens";
import { db } from "@db/client";
import { patientSessions } from "@db/patient/schema/index";

export const nextFreeSlot = async (clinicId: string) => {
  const available = (await ensureSlots(clinicId)).filter(
    (slot) => slot.heldByCaseId === null,
  );
  const slot = available[0];
  if (slot === undefined) throw new Error("No test slot available");
  return slot;
};

export const seedPatientSession = async (
  patientId: string,
): Promise<string> => {
  const token = generateSessionToken();
  await db.insert(patientSessions).values({
    patientId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return token;
};
