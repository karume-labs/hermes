import type { PatientCaseDetail } from "@/lib/api/queries";
import type { JourneyStep } from "@/lib/care-store";
import { formatDate, formatDateTime } from "@/lib/case-format";

export interface StepRow {
  step: JourneyStep;
  detail: string;
  when: string | null;
}

export const stepRows = (detail: PatientCaseDetail): StepRow[] => {
  const careCase = detail.careCase;
  const consulted =
    careCase.referralClinicId !== null || careCase.closedAt !== null;
  return [
    {
      step: "result_received",
      detail: careCase.summaryPlainLanguage,
      when: formatDateTime(careCase.createdAt),
    },
    {
      step: "appointment_booked",
      detail:
        detail.slot === null
          ? careCase.closedAt === null
            ? "No visit booked yet."
            : "Visit released when the care plan was signed off."
          : `${detail.slot.kind === "telehealth" ? "Video visit" : "In person"} · ${formatDateTime(detail.slot.startAt)}`,
      when:
        detail.appointment === null
          ? null
          : formatDateTime(detail.appointment.createdAt),
    },
    {
      step: "specialist_consultation",
      detail: consulted
        ? "Your record was shared with the specialist team."
        : "Your clinician reviews the result at your visit.",
      when: consulted ? formatDateTime(careCase.updatedAt) : null,
    },
    {
      step: "completed",
      detail:
        careCase.closurePlan === null
          ? "Awaiting clinical sign-off."
          : careCase.closurePlan,
      when: careCase.closedAt === null ? null : formatDate(careCase.closedAt),
    },
  ];
};
