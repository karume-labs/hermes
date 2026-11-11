import { api, unwrap } from "@/lib/api/client";
import {
  cacheProfile,
  clearPatientToken,
  getPatientToken,
  type PatientProfile,
  setPatientToken,
} from "@/lib/token-store";

export {
  cacheProfile,
  clearPatientToken,
  expirePatientSession,
  getCachedPatient,
  getPatientToken,
  onSessionExpired,
  type PatientProfile,
} from "@/lib/token-store";

interface RequestCodeResult {
  sent: boolean;
  expiresAt: string;
  devCode?: string;
}

export const requestPatientCode = async (
  phone: string,
): Promise<RequestCodeResult> =>
  unwrap(await api["patient-auth"]["request-code"].post({ phone }));

const acceptSession = async (result: {
  token: string;
  patient: PatientProfile;
}): Promise<PatientProfile> => {
  await setPatientToken(result.token);
  await cacheProfile(result.patient);
  return result.patient;
};

export const verifyPatientCode = async (
  phone: string,
  code: string,
): Promise<PatientProfile> =>
  acceptSession(unwrap(await api["patient-auth"].verify.post({ phone, code })));

/** Public sign-up: no clinic invite and no clinic id yet. */
export const registerPatient = async (input: {
  name: string;
  phone: string;
  email?: string;
  emailConsent?: boolean;
  notificationChannel?: "email" | "in_app" | "both";
}): Promise<PatientProfile> =>
  acceptSession(unwrap(await api["patient-auth"].register.post(input)));

export const loadPatientProfile = async (): Promise<PatientProfile | null> => {
  const token = await getPatientToken();
  if (token === null) return null;
  const profile = unwrap(await api["patient-auth"].session.get()).patient;
  await cacheProfile(profile);
  return profile;
};

export const signOutPatient = async (): Promise<void> => {
  const token = await getPatientToken();
  if (token !== null) {
    await api["patient-auth"]["sign-out"].post().catch(() => undefined);
  }
  await clearPatientToken();
};

export const updateConsent = async (input: {
  pushConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  notificationChannel: "email" | "in_app" | "both";
}): Promise<PatientProfile> => {
  const profile = unwrap(await api["patient-auth"].consent.patch(input));
  await cacheProfile(profile);
  return profile;
};
