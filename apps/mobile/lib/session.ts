import type { MobileEventType } from "@hermes/types";
import * as SecureStore from "expo-secure-store";
import { careApi } from "@/lib/care-api";

// No production sign-in yet: the seeded identity is the fallback while the
// API keeps every patient read scoped by patientId.
export const DEFAULT_PATIENT_ID = "patient-1-clinic-1";
export const PATIENT_IDS = [
  "patient-1-clinic-1",
  "patient-2-clinic-1",
  "patient-3-clinic-1",
  "patient-4-clinic-1",
];

const PATIENT_KEY = "hermes-patient-id";
const ACTIVE_CASE_KEY = "hermes-active-case";

export const getPatientId = async (): Promise<string> => {
  const stored = await SecureStore.getItemAsync(PATIENT_KEY);
  return stored === null ? DEFAULT_PATIENT_ID : stored;
};

export const setPatientId = async (patientId: string): Promise<void> => {
  await SecureStore.setItemAsync(PATIENT_KEY, patientId);
};

export const nextPatient = async (current: string): Promise<string> => {
  const index = PATIENT_IDS.indexOf(current);
  const next = PATIENT_IDS[(index + 1) % PATIENT_IDS.length];
  await setPatientId(next);
  return next;
};

export const setActiveCase = async (caseId: string): Promise<void> => {
  await SecureStore.setItemAsync(ACTIVE_CASE_KEY, caseId);
};

export const getActiveCase = async (): Promise<string | null> =>
  SecureStore.getItemAsync(ACTIVE_CASE_KEY);

// Telemetry must never block the patient flow.
export const trackEvent = (
  patientId: string,
  type: MobileEventType,
  caseId?: string,
): void => {
  careApi.recordEvent(patientId, type, caseId).catch((error: unknown) => {
    console.warn("Telemetry dropped", type, error);
  });
};
