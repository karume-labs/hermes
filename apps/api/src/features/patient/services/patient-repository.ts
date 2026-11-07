import { toBooking, toSlot } from "@api/features/booking/services/booking-dto";
import { toCareCase } from "@api/features/care-loop/services/case-repository";
import {
  journeyStage,
  toMessage,
} from "@api/features/patient/services/patient-dto";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { caseMessages } from "@db/patient/schema/index";
import type { CaseMessage, MessageSender, PatientCase } from "@hermes/types";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

export { journeyStage } from "@api/features/patient/services/patient-dto";

const decorate = async (
  rows: Array<typeof careCases.$inferSelect>,
): Promise<PatientCase[]> => {
  if (rows.length === 0) return [];
  const caseIds = rows.map((row) => row.id);
  const guestBookings = await db
    .select()
    .from(bookings)
    .where(
      and(inArray(bookings.caseId, caseIds), eq(bookings.status, "confirmed")),
    );
  const slotIds = guestBookings.map((booking) => booking.slotId);
  const slotRows =
    slotIds.length === 0
      ? []
      : await db.select().from(slots).where(inArray(slots.id, slotIds));
  const unreadRows = await db
    .select()
    .from(caseMessages)
    .where(
      and(
        inArray(caseMessages.caseId, caseIds),
        eq(caseMessages.sender, "coordinator"),
        isNull(caseMessages.readAt),
      ),
    );

  return rows.map((row) => {
    const careCase = toCareCase(row);
    const booking = guestBookings.find((item) => item.caseId === careCase.id);
    const slot = slotRows.find((item) => item.id === booking?.slotId);
    return {
      careCase,
      appointment: booking ? toBooking(booking) : null,
      slot: slot ? toSlot(slot) : null,
      journeyStage: journeyStage(careCase),
      unreadMessages: unreadRows.filter((item) => item.caseId === careCase.id)
        .length,
    };
  });
};

export const listPatientCases = async (
  patientId: string,
): Promise<PatientCase[]> => {
  const rows = await db
    .select()
    .from(careCases)
    .where(eq(careCases.patientId, patientId))
    .orderBy(desc(careCases.createdAt));
  return decorate(rows);
};

export const findPatientCase = async (
  patientId: string,
  caseId: string,
): Promise<PatientCase | null> => {
  const [row] = await db
    .select()
    .from(careCases)
    .where(and(eq(careCases.id, caseId), eq(careCases.patientId, patientId)));
  if (row === undefined) return null;
  const [decorated] = await decorate([row]);
  return decorated;
};

export const listMessages = async (caseId: string): Promise<CaseMessage[]> => {
  const rows = await db
    .select()
    .from(caseMessages)
    .where(eq(caseMessages.caseId, caseId))
    .orderBy(caseMessages.createdAt);
  return rows.map(toMessage);
};

export const createMessage = async (input: {
  caseId: string;
  sender: MessageSender;
  senderId: string;
  body: string;
}): Promise<CaseMessage> => {
  const [row] = await db.insert(caseMessages).values(input).returning();
  return toMessage(row);
};

export const markInboundMessagesRead = async (
  caseId: string,
  reader: "patient" | "coordinator",
): Promise<void> => {
  const inbound = reader === "patient" ? "coordinator" : "patient";
  await db
    .update(caseMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(caseMessages.caseId, caseId),
        eq(caseMessages.sender, inbound),
        isNull(caseMessages.readAt),
      ),
    );
};

export const listBookingsForPatient = async (patientId: string) => {
  const patientCases = await listPatientCases(patientId);
  return patientCases.flatMap((item) =>
    item.appointment === null ? [] : [item.appointment],
  );
};
