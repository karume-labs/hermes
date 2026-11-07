import {
  findBooking,
  patientHasCaseAtClinic,
} from "@api/features/booking/services/booking-repository";
import { findCase } from "@api/features/care-loop/services/case-repository";
import {
  type CarePrincipal,
  staffCanAccessClinic,
} from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";

export const actorOf = (principal: CarePrincipal): string =>
  principal.kind === "staff"
    ? `staff:${principal.staff.email}`
    : `patient:${principal.patient.patientId}`;

export const caseForPrincipal = async (
  principal: CarePrincipal,
  caseId: string,
) => {
  if (principal.kind === "staff") {
    return findCase(caseId, principal.staff.clinicId);
  }
  const found = await findCase(caseId);
  if (found === null || found.patientId !== principal.patient.patientId) {
    return null;
  }
  return found;
};

export const bookingForPrincipal = async (
  principal: CarePrincipal,
  bookingId: string,
) => {
  const booking = await findBooking(bookingId);
  if (booking === null) return null;
  const careCase = await caseForPrincipal(principal, booking.caseId);
  if (careCase === null) return null;
  return { booking, careCase };
};

export const assertClinicVisible = async (
  principal: CarePrincipal,
  clinicId: string,
): Promise<void> => {
  if (principal.kind === "staff") {
    if (!staffCanAccessClinic(principal.staff, clinicId)) {
      throw new NotFoundError("Clinic not found");
    }
    return;
  }
  const homeClinic = principal.patient.patient.clinicId === clinicId;
  const seenBefore = await patientHasCaseAtClinic(
    principal.patient.patientId,
    clinicId,
  );
  if (!homeClinic && !seenBefore) {
    throw new NotFoundError("Clinic not found");
  }
};
