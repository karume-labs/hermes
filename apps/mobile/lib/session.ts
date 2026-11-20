import type { MobileEventType } from "@hermes/types";
import { api } from "@/lib/api/client";
import { readKey, writeKey } from "@/lib/key-store";
import { getCachedPatient } from "@/lib/token-store";

const ACTIVE_CASE_KEY = "hermes-active-case";

/** Signed-in patient id, cached at sign-in. Throws if the session is gone. */
export const getPatientId = async (): Promise<string> => {
  const patient = await getCachedPatient();
  if (patient === null) {
    throw new Error("Sign in to continue.");
  }
  return patient.id;
};

export const setActiveCase = async (caseId: string): Promise<void> => {
  await writeKey(ACTIVE_CASE_KEY, caseId);
};

export const getActiveCase = async (): Promise<string | null> =>
  readKey(ACTIVE_CASE_KEY);

// Telemetry must never block the patient flow.
export const trackEvent = (
  patientId: string,
  type: MobileEventType,
  caseId?: string,
): void => {
  api
    .patients({ patientId })
    .events.post({ type, caseId })
    .catch((error: unknown) => {
      console.warn("Telemetry dropped", type, error);
    });
};
