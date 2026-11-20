import { deleteKey, readKey, writeKey } from "@/lib/key-store";

// The bearer token is a credential: devices keep it in the keychain/keystore,
// while the web build keeps it in localStorage instead (see lib/key-store.ts).
const TOKEN_KEY = "hermes-patient-token";
const PROFILE_KEY = "hermes-patient-profile";

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  clinicId: string | null;
  clinicName: string | null;
  pushConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  notificationChannel: "email" | "in_app" | "both";
}

export const getPatientToken = (): Promise<string | null> => readKey(TOKEN_KEY);

export const setPatientToken = (token: string): Promise<void> =>
  writeKey(TOKEN_KEY, token);

export const clearPatientToken = async (): Promise<void> => {
  await deleteKey(TOKEN_KEY);
  await deleteKey(PROFILE_KEY);
};

type SessionListener = () => void;

const expiryListeners = new Set<SessionListener>();

/** The root gate subscribes here so an expired token leaves the tabs at once. */
export const onSessionExpired = (listener: SessionListener): (() => void) => {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
};

let expiring = false;

/**
 * Called when any authenticated request answers 401 (a revoked or expired
 * 30-day token). Clears the stored credential once and notifies the gate, so
 * every screen lands back on sign-in instead of showing raw errors.
 */
export const expirePatientSession = async (): Promise<void> => {
  if (expiring) return;
  expiring = true;
  try {
    await clearPatientToken();
    for (const listener of expiryListeners) listener();
  } finally {
    expiring = false;
  }
};

export const cacheProfile = async (patient: PatientProfile): Promise<void> => {
  await writeKey(PROFILE_KEY, JSON.stringify(patient));
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
  const raw = await readKey(PROFILE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
