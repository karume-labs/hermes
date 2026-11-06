import { toCareCase } from "@api/features/care-loop/services/case-repository";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases, caseFeedback } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import {
  caseMessages,
  deviceTokens,
  mobileEvents,
} from "@db/patient/schema/index";
import type {
  Booking,
  CareCase,
  CaseFeedback,
  CaseMessage,
  JourneyStep,
  MessageSender,
  MobileEventType,
  PatientBooking,
  PatientCase,
  Slot,
} from "@hermes/types";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

const toSlot = (row: typeof slots.$inferSelect): Slot => ({
  id: row.id,
  clinicId: row.clinicId,
  startAt: row.startAt.toISOString(),
  endAt: row.endAt.toISOString(),
  kind: row.kind,
  heldByCaseId: row.heldByCaseId ?? null,
});

const toBooking = (row: typeof bookings.$inferSelect): Booking => ({
  id: row.id,
  caseId: row.caseId,
  slotId: row.slotId,
  status: row.status,
  prepInstructions: row.prepInstructions,
  createdAt: row.createdAt.toISOString(),
});

const toMessage = (row: typeof caseMessages.$inferSelect): CaseMessage => ({
  id: row.id,
  caseId: row.caseId,
  sender: row.sender,
  senderId: row.senderId,
  body: row.body,
  createdAt: row.createdAt.toISOString(),
  readAt: row.readAt ? row.readAt.toISOString() : null,
});

export const journeyStage = (careCase: CareCase): JourneyStep => {
  if (careCase.status === "closed") return "completed";
  if (careCase.consultedAt !== null || careCase.treatmentStartedAt !== null)
    return "specialist_consultation";
  if (
    careCase.appointmentId !== null ||
    careCase.status === "appointment_booked"
  )
    return "appointment_booked";
  return "result_received";
};

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
    caseId: input.caseId ?? null,
    type: input.type,
  });
};

export const listMobileEvents = async (since: Date) => {
  const rows = await db.select().from(mobileEvents);
  return rows.filter((row) => row.createdAt >= since);
};

export const listBookingsForPatient = async (patientId: string) => {
  const patientCases = await listPatientCases(patientId);
  return patientCases.flatMap((item) =>
    item.appointment === null ? [] : [item.appointment],
  );
};

/** Every visit the patient has, including cancelled and past ones. */
export const listPatientBookings = async (
  patientId: string,
): Promise<PatientBooking[]> => {
  const rows = await db
    .select({
      booking: bookings,
      slot: slots,
      clinicName: clinics.name,
      summary: careCases.summaryPlainLanguage,
      severity: careCases.severity,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(careCases, eq(bookings.caseId, careCases.id))
    .innerJoin(clinics, eq(careCases.clinicId, clinics.id))
    .where(eq(careCases.patientId, patientId))
    .orderBy(desc(slots.startAt));
  return rows.map((row) => ({
    booking: toBooking(row.booking),
    slot: toSlot(row.slot),
    clinicName: row.clinicName,
    summary: row.summary,
    severity: row.severity,
  }));
};

const toFeedback = (row: typeof caseFeedback.$inferSelect): CaseFeedback => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

export const findCaseFeedback = async (
  caseId: string,
): Promise<CaseFeedback | null> => {
  const [row] = await db
    .select()
    .from(caseFeedback)
    .where(eq(caseFeedback.caseId, caseId))
    .limit(1);
  return row === undefined ? null : toFeedback(row);
};

// A patient may revise their teach-back answer; the latest response wins.
export const saveCaseFeedback = async (input: {
  caseId: string;
  patientId: string;
  understood: boolean;
  confidence: number;
  comment?: string;
}): Promise<CaseFeedback> => {
  const [row] = await db
    .insert(caseFeedback)
    .values({
      caseId: input.caseId,
      patientId: input.patientId,
      understood: input.understood,
      confidence: input.confidence,
      comment: input.comment ?? null,
    })
    .onConflictDoUpdate({
      target: caseFeedback.caseId,
      set: {
        understood: input.understood,
        confidence: input.confidence,
        comment: input.comment ?? null,
        createdAt: new Date(),
      },
    })
    .returning();
  return toFeedback(row);
};
