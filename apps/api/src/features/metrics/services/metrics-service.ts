import { listBookings } from "@api/features/booking/services/booking-repository";
import { listAllCases } from "@api/features/care-loop/services/case-repository";
import { notificationRows } from "@api/features/notify/services/notification-stats";
import { listMobileEvents } from "@api/features/patient/services/patient-device-service";
import { caseFeedback, caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CareCase } from "@hermes/types";
import dayjs from "dayjs";
import { inArray } from "drizzle-orm";

const round = (value: number): number => Math.round(value * 10) / 10;
const pct = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;

const breached = (careCase: CareCase, now: dayjs.Dayjs): boolean => {
  if (!now.isAfter(dayjs(careCase.slaDueAt))) return false;
  if (careCase.status === "closed") return false;
  return (
    careCase.acknowledgedAt === null ||
    dayjs(careCase.acknowledgedAt).isAfter(dayjs(careCase.slaDueAt))
  );
};

const measure = (
  cases: CareCase[],
  timestamp: (careCase: CareCase) => string | null,
): number => {
  const measured = cases.filter((careCase) => timestamp(careCase) !== null);
  if (measured.length === 0) return 0;
  const total = measured.reduce(
    (sum, careCase) =>
      sum +
      dayjs(timestamp(careCase)).diff(dayjs(careCase.createdAt), "hour", true),
    0,
  );
  return round(total / measured.length);
};

// Governance numbers the dashboard promises: timeliness at every clinical
// transition, referral continuity, unresolved work, closure quality and
// patient-reported understanding.
export const buildMetrics = async (clinicId: string | null = null) => {
  const now = dayjs();
  const since = now.subtract(7, "day").toDate();
  const previous = now.subtract(14, "day").toDate();
  const all = await listAllCases(clinicId);
  const caseIds = new Set(all.map((careCase) => careCase.id));
  const patientIds = new Set(all.map((careCase) => careCase.patientId));
  const [appointmentRows, notifRows, eventRows, referralRows, feedbackRows] =
    await Promise.all([
      listBookings(),
      notificationRows(),
      listMobileEvents(previous),
      caseIds.size === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(caseReferrals)
            .where(inArray(caseReferrals.caseId, [...caseIds])),
      caseIds.size === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(caseFeedback)
            .where(inArray(caseFeedback.caseId, [...caseIds])),
    ]);
  const appointmentList = appointmentRows.filter((booking) =>
    caseIds.has(booking.caseId),
  );
  const notifications = notifRows.filter((row) => caseIds.has(row.caseId));
  const events = eventRows.filter((event) => patientIds.has(event.patientId));

  const delivery = {
    queued: notifications.filter((row) => row.status === "queued").length,
    sent: notifications.filter((row) => row.status === "sent").length,
    failed: notifications.filter((row) => row.status === "failed").length,
    read: notifications.filter((row) => row.status === "read").length,
    smsQueued: notifications.filter(
      (row) => row.kind === "sms_fallback" && row.status !== "failed",
    ).length,
  };

  const breaches = all.filter((careCase) => breached(careCase, now)).length;
  const acked = all.filter((careCase) => careCase.acknowledgedAt !== null);
  const pendingAcknowledgement = all.filter(
    (careCase) =>
      careCase.acknowledgedAt === null &&
      (careCase.status === "notified" || careCase.status === "escalated"),
  ).length;
  const pushRows = notifications.filter((row) => row.channel === "push");
  const pushRead = pushRows.filter((row) => row.readAt !== null).length;
  const pushSettled = pushRows.filter(
    (row) => row.readAt !== null || row.status === "sent",
  ).length;
  const opened = events.filter((event) => event.type === "app_open");
  const recentPatients = new Set(
    opened
      .filter((event) => event.createdAt >= since)
      .map((event) => event.patientId),
  );
  const priorPatients = new Set(
    opened
      .filter((event) => event.createdAt < since)
      .map((event) => event.patientId),
  );
  const retained = [...priorPatients].filter((id) => recentPatients.has(id));

  const bookingHours = appointmentList.reduce((sum, booking) => {
    const careCase = all.find((item) => item.id === booking.caseId);
    if (careCase === undefined) return sum;
    return (
      sum +
      dayjs(booking.createdAt).diff(dayjs(careCase.createdAt), "hour", true)
    );
  }, 0);

  const acceptedStatuses = new Set(["accepted", "completed"]);
  const acceptedReferrals = referralRows.filter((row) =>
    acceptedStatuses.has(row.status),
  ).length;
  const completedReferrals = referralRows.filter(
    (row) => row.status === "completed",
  ).length;
  const earliestNotification = (careCase: CareCase): string | null => {
    const rows = notifications.filter((row) => row.caseId === careCase.id);
    if (rows.length === 0) return null;
    return rows
      .map((row) => row.createdAt)
      .sort((left, right) => left.getTime() - right.getTime())[0]
      .toISOString();
  };
  const closed = all.filter((careCase) => careCase.status === "closed");
  const documented = closed.filter(
    (careCase) =>
      careCase.closureEvidence !== null &&
      careCase.closureEvidence.trim() !== "" &&
      careCase.closurePlan !== null &&
      careCase.closurePlan.trim() !== "",
  );
  const understood = feedbackRows.filter((row) => row.understood).length;
  const delayReasons: Record<string, number> = {};
  for (const careCase of all) {
    if (careCase.dropOffReason === null) continue;
    const key = careCase.dropOffReason;
    delayReasons[key] = (delayReasons[key] ?? 0) + 1;
  }

  return {
    total: all.length,
    closed: closed.length,
    escalated: all.filter((careCase) => careCase.status === "escalated").length,
    slaBreaches: breaches,
    slaBreachPct: pct(breaches, all.length),
    pendingAcknowledgement,
    overdue: all.filter((careCase) => breached(careCase, now)).length,
    unresolvedActionable: all.filter(
      (careCase) =>
        careCase.severity !== "Routine" && careCase.status !== "closed",
    ).length,
    unassignedOpen: all.filter(
      (careCase) =>
        careCase.assignedToId === null && careCase.status !== "closed",
    ).length,
    referralsDeclined: referralRows.filter((row) => row.status === "declined")
      .length,
    referralsPending: referralRows.filter((row) => row.status === "sent")
      .length,
    avgTimeToClosureHours: measure(closed, (careCase) => careCase.closedAt),
    avgAckHours: measure(all, (careCase) => careCase.acknowledgedAt),
    avgAckBySeverity: {
      Routine: measure(
        all.filter((careCase) => careCase.severity === "Routine"),
        (careCase) => careCase.acknowledgedAt,
      ),
      Actionable: measure(
        all.filter((careCase) => careCase.severity === "Actionable"),
        (careCase) => careCase.acknowledgedAt,
      ),
      Urgent: measure(
        all.filter((careCase) => careCase.severity === "Urgent"),
        (careCase) => careCase.acknowledgedAt,
      ),
    },
    mobileAckPct: pct(acked.length, all.length),
    referrals: referralRows.length,
    referralConversionPct: pct(completedReferrals, referralRows.length),
    referralsAccepted: acceptedReferrals,
    referralsCompleted: completedReferrals,
    referralAcceptancePct: pct(acceptedReferrals, referralRows.length),
    referralCompletionPct: pct(completedReferrals, referralRows.length),
    appointments: appointmentList.length,
    avgTimeToBookingHours:
      appointmentList.length === 0
        ? 0
        : round(bookingHours / appointmentList.length),
    avgTimeToNotificationHours: measure(all, earliestNotification),
    avgTimeToConfirmationHours: measure(
      all,
      (careCase) => careCase.confirmedAt,
    ),
    avgTimeToConsultationHours: measure(
      all,
      (careCase) => careCase.consultedAt,
    ),
    avgTimeToTreatmentHours: measure(
      all,
      (careCase) => careCase.treatmentStartedAt,
    ),
    documentedClosurePct: pct(documented.length, closed.length),
    patientUnderstandingPct: pct(understood, feedbackRows.length),
    avgConfidence:
      feedbackRows.length === 0
        ? 0
        : round(
            feedbackRows.reduce((sum, row) => sum + row.confidence, 0) /
              feedbackRows.length,
          ),
    feedbackCount: feedbackRows.length,
    delayReasons,
    pushReadPct: pct(pushRead, pushSettled),
    activePatients7d: recentPatients.size,
    appOpens7d: opened.filter((event) => event.createdAt >= since).length,
    retention7dPct: pct(retained.length, priorPatients.size),
    delivery,
    bySeverity: {
      Routine: all.filter((careCase) => careCase.severity === "Routine").length,
      Actionable: all.filter((careCase) => careCase.severity === "Actionable")
        .length,
      Urgent: all.filter((careCase) => careCase.severity === "Urgent").length,
    },
  };
};
