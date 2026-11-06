import { listBookings } from "@api/features/booking/services/booking-repository";
import { listAllCases } from "@api/features/care-loop/services/case-repository";
import { notificationRows } from "@api/features/notify/services/notification-service";
import { listMobileEvents } from "@api/features/patient/services/patient-repository";
import type { CareCase } from "@hermes/types";
import dayjs from "dayjs";

const round = (value: number): number => Math.round(value * 10) / 10;
const pct = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;

const breached = (careCase: CareCase, now: dayjs.Dayjs): boolean => {
  if (!now.isAfter(dayjs(careCase.slaDueAt))) return false;
  return (
    careCase.acknowledgedAt === null ||
    dayjs(careCase.acknowledgedAt).isAfter(dayjs(careCase.slaDueAt))
  );
};

const avgAck = (cases: CareCase[]): number => {
  const acked = cases.filter((careCase) => careCase.acknowledgedAt !== null);
  if (acked.length === 0) return 0;
  const total = acked.reduce((sum, careCase) => {
    if (careCase.acknowledgedAt === null) return sum;
    return (
      sum +
      dayjs(careCase.acknowledgedAt).diff(
        dayjs(careCase.createdAt),
        "hour",
        true,
      )
    );
  }, 0);
  return round(total / acked.length);
};

// Governance numbers the admin portal promises: SLA breach %, acknowledgment
// speed, referral conversion, push read rate and 7-day mobile retention.
export const buildMetrics = async (clinicId: string | null = null) => {
  const now = dayjs();
  const since = now.subtract(7, "day").toDate();
  const previous = now.subtract(14, "day").toDate();
  const all = await listAllCases(clinicId);
  const caseIds = new Set(all.map((careCase) => careCase.id));
  const patientIds = new Set(all.map((careCase) => careCase.patientId));
  const appointmentRows = (await listBookings()).filter((booking) =>
    caseIds.has(booking.caseId),
  );
  const notifications = (await notificationRows()).filter((row) =>
    caseIds.has(row.caseId),
  );
  const delivery = {
    queued: notifications.filter((row) => row.status === "queued").length,
    sent: notifications.filter((row) => row.status === "sent").length,
    failed: notifications.filter((row) => row.status === "failed").length,
    read: notifications.filter((row) => row.status === "read").length,
    smsQueued: notifications.filter(
      (row) => row.kind === "sms_fallback" && row.status !== "failed",
    ).length,
  };
  const events = (await listMobileEvents(previous)).filter((event) =>
    patientIds.has(event.patientId),
  );

  const breaches = all.filter((careCase) => breached(careCase, now)).length;
  const acked = all.filter((careCase) => careCase.acknowledgedAt !== null);
  const pendingAcknowledgement = all.filter(
    (careCase) =>
      careCase.acknowledgedAt === null &&
      (careCase.status === "notified" || careCase.status === "escalated"),
  ).length;
  const referrals = all.filter(
    (careCase) => careCase.referralClinicId !== null,
  ).length;
  const pushRows = notifications.filter((row) => row.channel === "push");
  const pushRead = pushRows.filter((row) => row.readAt !== null).length;
  const pushSettled = pushRows.filter(
    (row) => row.readAt !== null || row.status === "sent",
  ).length;
  const opened = events.filter((event) => event.type === "app_open");
  const recentOpens = opened.filter((event) => event.createdAt >= since);
  const priorOpens = opened.filter((event) => event.createdAt < since);
  const recentPatients = new Set(recentOpens.map((event) => event.patientId));
  const priorPatients = new Set(priorOpens.map((event) => event.patientId));
  const retained = [...priorPatients].filter((id) => recentPatients.has(id));

  const bookingHours = appointmentRows.reduce((sum, booking) => {
    const careCase = all.find((item) => item.id === booking.caseId);
    if (careCase === undefined) return sum;
    return (
      sum +
      dayjs(booking.createdAt).diff(dayjs(careCase.createdAt), "hour", true)
    );
  }, 0);

  return {
    total: all.length,
    closed: all.filter((careCase) => careCase.status === "closed").length,
    escalated: all.filter((careCase) => careCase.status === "escalated").length,
    slaBreaches: breaches,
    slaBreachPct: pct(breaches, all.length),
    pendingAcknowledgement,
    avgAckHours: avgAck(all),
    avgAckBySeverity: {
      Routine: avgAck(
        all.filter((careCase) => careCase.severity === "Routine"),
      ),
      Actionable: avgAck(
        all.filter((careCase) => careCase.severity === "Actionable"),
      ),
      Urgent: avgAck(all.filter((careCase) => careCase.severity === "Urgent")),
    },
    mobileAckPct: pct(acked.length, all.length),
    referrals,
    referralConversionPct: pct(referrals, all.length),
    appointments: appointmentRows.length,
    avgTimeToBookingHours:
      appointmentRows.length === 0
        ? 0
        : round(bookingHours / appointmentRows.length),
    pushReadPct: pct(pushRead, pushSettled),
    activePatients7d: recentPatients.size,
    appOpens7d: recentOpens.length,
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
