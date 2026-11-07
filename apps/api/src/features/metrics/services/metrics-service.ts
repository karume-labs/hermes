import {
  deliveryMetrics,
  engagementMetrics,
} from "@api/features/metrics/services/metrics-engagement";
import {
  bookingHours,
  breached,
  earliestNotifier,
  loadMetricInputs,
  measure,
  pct,
  round,
} from "@api/features/metrics/services/metrics-inputs";

// Governance numbers the dashboard promises: timeliness at every clinical
// transition, referral continuity, unresolved work, closure quality and
// patient-reported understanding.
export const buildMetrics = async (clinicId: string | null = null) => {
  const {
    now,
    since,
    all,
    referralRows,
    feedbackRows,
    appointmentList,
    notifications,
    events,
  } = await loadMetricInputs(clinicId);

  const delivery = deliveryMetrics(notifications);

  const breaches = all.filter((careCase) => breached(careCase, now)).length;
  const acked = all.filter((careCase) => careCase.acknowledgedAt !== null);
  const pendingAcknowledgement = all.filter(
    (careCase) =>
      careCase.acknowledgedAt === null &&
      (careCase.status === "notified" || careCase.status === "escalated"),
  ).length;
  const engagement = engagementMetrics(notifications, events, since);

  const bookingTotal = bookingHours(all, appointmentList);

  const acceptedStatuses = new Set(["accepted", "completed"]);
  const acceptedReferrals = referralRows.filter((row) =>
    acceptedStatuses.has(row.status),
  ).length;
  const completedReferrals = referralRows.filter(
    (row) => row.status === "completed",
  ).length;
  const earliestNotification = earliestNotifier(notifications);
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
        : round(bookingTotal / appointmentList.length),
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
    ...engagement,
    delivery,
    bySeverity: {
      Routine: all.filter((careCase) => careCase.severity === "Routine").length,
      Actionable: all.filter((careCase) => careCase.severity === "Actionable")
        .length,
      Urgent: all.filter((careCase) => careCase.severity === "Urgent").length,
    },
  };
};
