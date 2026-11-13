import type { StaffRole } from "@hermes/types";

export const CLINICAL_ROLES: { value: StaffRole; label: string }[] = [
  { value: "coordinator", label: "Coordinator" },
  { value: "clinician", label: "Clinician" },
];

export const PLATFORM_ROLES: { value: StaffRole; label: string }[] = [
  ...CLINICAL_ROLES,
  { value: "org_admin", label: "Organization admin" },
  { value: "admin", label: "Platform administrator" },
];
