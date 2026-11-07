import { findBookingByCaseId } from "@api/features/booking/services/booking-repository";
import { findSlot } from "@api/features/booking/services/slot-service";
import { teamMember } from "@api/features/care-loop/services/assignment-service";
import {
  findCase,
  listAudit,
} from "@api/features/care-loop/services/case-repository";
import { listTasks } from "@api/features/care-loop/services/task-service";
import { listAttachments } from "@api/features/documents/services/attachment-repository";
import { listNotifications } from "@api/features/notify/services/notification-service";
import { listMessages } from "@api/features/patient/services/patient-repository";
import type { StaffContext } from "@api/features/shared/auth/index";
import {
  caseConsultNotes,
  caseFeedback,
  caseReferrals,
} from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CaseFeedback } from "@hermes/types";
import { desc, eq } from "drizzle-orm";

const toFeedback = (row: typeof caseFeedback.$inferSelect): CaseFeedback => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

// Full case file: everything the care team needs in one request, including the
// shared referral history and the patient's teach-back response.
export const getCaseDetail = async (id: string, staff: StaffContext) => {
  const careCase = await findCase(id, staff.clinicId);
  if (careCase === null) return null;
  const appointment = await findBookingByCaseId(careCase.id);
  const slot = appointment === null ? null : await findSlot(appointment.slotId);
  const [feedbackRow] = await db
    .select()
    .from(caseFeedback)
    .where(eq(caseFeedback.caseId, careCase.id))
    .limit(1);
  return {
    ...careCase,
    audit: await listAudit(careCase.id),
    messages: await listMessages(careCase.id),
    notifications: await listNotifications(careCase.id),
    appointment,
    slot,
    attachments: await listAttachments(careCase.id),
    referrals: (
      await db
        .select()
        .from(caseReferrals)
        .where(eq(caseReferrals.caseId, careCase.id))
        .orderBy(desc(caseReferrals.createdAt))
    ).map((row) => ({
      ...row,
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      declinedAt: row.declinedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    consultNotes:
      staff.role === "clinician" || staff.role === "admin"
        ? (
            await db
              .select()
              .from(caseConsultNotes)
              .where(eq(caseConsultNotes.caseId, careCase.id))
              .orderBy(caseConsultNotes.createdAt)
          ).map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
        : [],
    tasks: await listTasks(staff, { caseId: careCase.id }),
    feedback: feedbackRow === undefined ? null : toFeedback(feedbackRow),
    assignee:
      careCase.assignedToId === null
        ? null
        : await teamMember(careCase.assignedToId),
  };
};
