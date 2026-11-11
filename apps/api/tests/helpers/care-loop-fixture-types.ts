import type { createCase } from "@api/features/care-loop/services/case-repository";
import type { StaffContext } from "@api/features/shared/auth/index";

export interface CareLoopFixtures {
  clinicA: string;
  clinicB: string;
  patientId: string;
  coordinatorId: string;
  clinicianId: string;
  coordinatorBId: string;
  coordinator: StaffContext;
  clinician: StaffContext;
  admin: StaffContext;
  createCase: (patch?: {
    assignedToId?: string | null;
    status?: "acknowledged" | "notified";
    nextReviewAt?: Date | null;
    patientId?: string;
    clinicId?: string;
  }) => ReturnType<typeof createCase>;
  cleanup: () => Promise<void>;
}
