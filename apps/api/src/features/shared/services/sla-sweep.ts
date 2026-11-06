import { defaultAssigneeId } from "@api/features/care-loop/services/assignment-service";
import {
  listAllCases,
  logAudit,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import {
  ensureScheduledTask,
  ensureTask,
} from "@api/features/care-loop/services/task-service";
import { isUnacknowledgedBeyond } from "@api/features/care-loop/services/triage";
import { queueNotification } from "@api/features/notify/services/notification-service";
import type { CareCase } from "@hermes/types";
import dayjs from "dayjs";

// Surveillance is scheduled work, not a status: a case that is already
// escalated still needs its review task when the date arrives. One task per
// review date keeps repeated sweeps from flooding the worklist.
export const queueSurveillanceReviews = async (
  cases: CareCase[],
  now: Date,
): Promise<void> => {
  for (const careCase of cases) {
    if (
      careCase.status === "closed" ||
      careCase.nextReviewAt === null ||
      dayjs(now).isBefore(dayjs(careCase.nextReviewAt))
    )
      continue;
    const owner =
      careCase.assignedToId ?? (await defaultAssigneeId(careCase.clinicId));
    await ensureScheduledTask({
      caseId: careCase.id,
      clinicId: careCase.clinicId,
      assignedToId: owner,
      kind: "surveillance_review",
      title: "Surveillance review due",
      detail: careCase.surveillancePlan,
      dueAt: new Date(careCase.nextReviewAt),
      createdBy: "system",
    });
  }
};

// SLA sweep runs every 5 minutes. It flags breached cases and alerts the
// coordinator queue, plus an SMS fallback when the in-app alert went unread.
export const runSlaSweep = async (now: Date = new Date()): Promise<number> => {
  const all = await listAllCases();
  await queueSurveillanceReviews(all, now);
  let escalated = 0;
  for (const careCase of all) {
    if (careCase.status === "closed" || careCase.status === "escalated")
      continue;
    const slaBreach = dayjs(now).isAfter(dayjs(careCase.slaDueAt));
    const windowHours = careCase.severity === "Routine" ? 168 : 48;
    const unacked =
      careCase.acknowledgedAt === null &&
      isUnacknowledgedBeyond(new Date(careCase.createdAt), windowHours, now);
    if (!slaBreach && !unacked) continue;

    const updated = await updateCase(careCase.id, {
      status: "escalated",
      escalatedAt: now,
    });
    if (updated === null) continue;

    await ensureTask({
      caseId: updated.id,
      clinicId: updated.clinicId,
      assignedToId: updated.assignedToId,
      kind: "overdue",
      title: "Overdue result needs outreach",
      detail: slaBreach ? "SLA breached" : "No acknowledgment after outreach",
      dueAt: now,
      createdBy: "system",
    });

    await queueNotification({
      caseId: updated.id,
      patientId: updated.patientId,
      channel: "in_app",
      kind: "escalation",
      payload: {
        severity: updated.severity,
        summary: updated.summaryPlainLanguage,
        reason: slaBreach ? "sla_breach" : "unacknowledged_push",
        unacked,
        slaBreach,
      },
    });
    if (unacked) {
      await queueNotification({
        caseId: updated.id,
        patientId: updated.patientId,
        channel: "sms",
        kind: "sms_fallback",
        payload: {
          // Reuse the patient-facing summary so the SMS matches the app.
          summary: updated.summaryPlainLanguage,
        },
      });
    }
    await logAudit(updated.id, "system", "auto_escalated", {
      slaBreach,
      unacked,
      coordinatorNotified: true,
    });
    escalated += 1;
  }
  return escalated;
};
