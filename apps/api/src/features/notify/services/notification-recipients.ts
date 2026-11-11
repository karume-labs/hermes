import type { NotificationRow } from "@api/features/notify/services/notification-dto";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { deviceTokens } from "@db/patient/schema/index";
import type { NotificationPreference } from "@hermes/types";
import { eq, inArray } from "drizzle-orm";

export interface PatientContact {
  name: string;
  phone: string;
  email: string | null;
  clinicName: string | null;
  pushConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  notificationChannel: NotificationPreference;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const pushTokensFor = async (patientId: string): Promise<string[]> => {
  const rows = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(eq(deviceTokens.patientId, patientId));
  return rows.map((row) => row.token);
};

export const contactsFor = async (
  patientIds: string[],
): Promise<Map<string, PatientContact>> => {
  if (patientIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      email: patients.email,
      clinicName: clinics.name,
      pushConsent: patients.pushConsent,
      smsConsent: patients.smsConsent,
      emailConsent: patients.emailConsent,
      notificationChannel: patients.notificationChannel,
    })
    .from(patients)
    .leftJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(inArray(patients.id, patientIds));
  return new Map(
    rows.map((row) => [
      row.id,
      {
        name: row.name,
        phone: row.phone,
        email: row.email,
        clinicName: row.clinicName,
        pushConsent: row.pushConsent,
        smsConsent: row.smsConsent,
        emailConsent: row.emailConsent,
        notificationChannel: row.notificationChannel,
      },
    ]),
  );
};

export const notificationText = (row: NotificationRow): string => {
  if (isRecord(row.payload)) {
    if (typeof row.payload.text === "string") return row.payload.text;
    if (typeof row.payload.summary === "string") return row.payload.summary;
  }
  switch (row.kind) {
    case "visit_reminder":
      return "Your visit is tomorrow. Bring prior labs and arrive 15 minutes early.";
    case "escalation":
      return "Your result still needs follow-up. Open Hermes Care or call your clinic.";
    case "secure_message":
      return "Your care team sent you a secure message.";
    default:
      return "A new result is ready in Hermes Care.";
  }
};
