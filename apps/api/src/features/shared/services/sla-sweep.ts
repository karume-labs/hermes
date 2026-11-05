import {
  listAllCases,
  logAudit,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import { isUnacknowledgedBeyond } from "@api/features/care-loop/services/triage";
import { queueNotification } from "@api/features/notify/services/notification-service";
import dayjs from "dayjs";

// SLA sweep runs every 5 minutes. It flags breached cases and alerts the
// coordinator queue, plus an SMS fallback when the in-app alert went unread.
export const runSlaSweep = async (now: Date = new Date()): Promise<number> => {
  const all = await listAllCases();
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

    await queueNotification({
      caseId: updated.id,
      patientId: updated.patientId,
      channel: "in_app",
      kind: "escalation",
      payload: {
        severity: updated.severity,
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
          text: `Hermes Care: your ${updated.severity.toLowerCase()} result still needs follow-up. Tap your secure link or call your clinic.`,
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
