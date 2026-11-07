import type { caseFeedback } from "@db/care-loop/schema/index";
import type { caseMessages } from "@db/patient/schema/index";
import type {
  CareCase,
  CaseFeedback,
  CaseMessage,
  JourneyStep,
} from "@hermes/types";

export const toMessage = (
  row: typeof caseMessages.$inferSelect,
): CaseMessage => ({
  id: row.id,
  caseId: row.caseId,
  sender: row.sender,
  senderId: row.senderId,
  body: row.body,
  createdAt: row.createdAt.toISOString(),
  readAt: row.readAt ? row.readAt.toISOString() : null,
});

export const toFeedback = (
  row: typeof caseFeedback.$inferSelect,
): CaseFeedback => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
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
