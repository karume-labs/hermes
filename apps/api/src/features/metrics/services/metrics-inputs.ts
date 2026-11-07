import { listBookings } from "@api/features/booking/services/booking-repository";
import { listAllCases } from "@api/features/care-loop/services/case-repository";
import type { NotificationRow } from "@api/features/metrics/types";
import { notificationRows } from "@api/features/notify/services/notification-stats";
import { listMobileEvents } from "@api/features/patient/services/patient-device-service";
import { caseFeedback, caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CareCase } from "@hermes/types";
import dayjs from "dayjs";
import { inArray } from "drizzle-orm";

export const round = (value: number): number => Math.round(value * 10) / 10;

export const pct = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;

export const breached = (careCase: CareCase, now: dayjs.Dayjs): boolean => {
  if (!now.isAfter(dayjs(careCase.slaDueAt))) return false;
  if (careCase.status === "closed") return false;
  return (
    careCase.acknowledgedAt === null ||
    dayjs(careCase.acknowledgedAt).isAfter(dayjs(careCase.slaDueAt))
  );
};

export const measure = (
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

/** Average hours from case creation to the first notification, per case. */
export const earliestNotifier =
  (notifications: NotificationRow[]): ((careCase: CareCase) => string | null) =>
  (careCase) => {
    const rows = notifications.filter((row) => row.caseId === careCase.id);
    if (rows.length === 0) return null;
    return rows
      .map((row) => row.createdAt)
      .sort((left, right) => left.getTime() - right.getTime())[0]
      .toISOString();
  };

/** Total hours spent between case creation and booking, across all bookings. */
export const bookingHours = (
  cases: CareCase[],
  appointmentList: { caseId: string; createdAt: string }[],
): number =>
  appointmentList.reduce((sum, booking) => {
    const careCase = cases.find((item) => item.id === booking.caseId);
    if (careCase === undefined) return sum;
    return (
      sum +
      dayjs(booking.createdAt).diff(dayjs(careCase.createdAt), "hour", true)
    );
  }, 0);

export const loadMetricInputs = async (clinicId: string | null) => {
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

  return {
    now,
    since,
    all,
    caseIds,
    patientIds,
    referralRows,
    feedbackRows,
    appointmentList: appointmentRows.filter((booking) =>
      caseIds.has(booking.caseId),
    ),
    notifications: notifRows.filter((row) => caseIds.has(row.caseId)),
    events: eventRows.filter((event) => patientIds.has(event.patientId)),
  };
};
