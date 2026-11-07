import * as SecureStore from "expo-secure-store";
import { env } from "@/lib/env/index";
import { readJson } from "@/lib/http";

const TOKEN_KEY = "hermes-patient-token";
const PROFILE_KEY = "hermes-patient-profile";

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  clinicId: string;
  clinicName: string;
  pushConsent: boolean;
  smsConsent: boolean;
}

interface RequestCodeResult {
  sent: boolean;
  expiresAt: string;
  devCode?: string;
}

const parseError = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (
    body !== null &&
    typeof body === "object" &&
    "error" in body &&
    body.error !== null &&
    typeof body.error === "object" &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }
  if (
    body !== null &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `Request failed (${response.status})`;
};

const post = async <T>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(`${env.apiBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return await readJson<T>(response);
};

export const getPatientToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(TOKEN_KEY);

export const clearPatientToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(PROFILE_KEY);
};

const cacheProfile = async (patient: PatientProfile): Promise<void> => {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(patient));
};

const isProfile = (value: unknown): value is PatientProfile =>
  value !== null &&
  typeof value === "object" &&
  "id" in value &&
  typeof value.id === "string" &&
  "name" in value &&
  typeof value.name === "string";

/** Last known patient, for screens that only need the id. */
export const getCachedPatient = async (): Promise<PatientProfile | null> => {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const requestPatientCode = (phone: string): Promise<RequestCodeResult> =>
  post("/patient-auth/request-code", { phone });

export const verifyPatientCode = async (
  phone: string,
  code: string,
): Promise<PatientProfile> => {
  const result = await post<{ token: string; patient: PatientProfile }>(
    "/patient-auth/verify",
    { phone, code },
  );
  await SecureStore.setItemAsync(TOKEN_KEY, result.token);
  await cacheProfile(result.patient);
  return result.patient;
};

export const loadPatientProfile = async (): Promise<PatientProfile | null> => {
  const token = await getPatientToken();
  if (token === null) return null;
  const response = await fetch(`${env.apiBase}/patient-auth/session`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    await clearPatientToken();
    return null;
  }
  if (!response.ok) throw new Error(await parseError(response));
  const body = (await response.json()) as { patient: PatientProfile };
  await cacheProfile(body.patient);
  return body.patient;
};

export const signOutPatient = async (): Promise<void> => {
  const token = await getPatientToken();
  if (token !== null) {
    await fetch(`${env.apiBase}/patient-auth/sign-out`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
  await clearPatientToken();
};

export const updateConsent = async (
  pushConsent: boolean,
  smsConsent: boolean,
): Promise<PatientProfile> => {
  const token = await getPatientToken();
  if (token === null) throw new Error("Sign in to change your preferences.");
  const response = await fetch(`${env.apiBase}/patient-auth/consent`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pushConsent, smsConsent }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return await readJson<PatientProfile>(response);
};
