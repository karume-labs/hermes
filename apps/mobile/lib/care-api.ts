import type {
  Booking,
  CaseMessage,
  MobileEventType,
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
  PatientCase,
  Slot,
} from "@hermes/types";
import { getPatientToken } from "@/lib/auth";
import { env } from "@/lib/env/index";

export interface PatientNotification {
  id: string;
  caseId: string;
  patientId: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  status: NotificationStatus;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
}

export interface PatientCaseDetail extends PatientCase {
  messages: CaseMessage[];
  notifications: PatientNotification[];
}

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = await getPatientToken();
  const response = await fetch(`${env.apiBase}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body !== null &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : undefined;
    throw new Error(
      message === undefined ? `Request failed (${response.status})` : message,
    );
  }
  const data: unknown = await response.json();
  return data as T;
};

const postJson = <T>(path: string, payload: unknown): Promise<T> =>
  requestJson<T>(path, { method: "POST", body: JSON.stringify(payload) });

export const careApi = {
  patientCases: (patientId: string): Promise<PatientCase[]> =>
    requestJson(`/patients/${patientId}/cases`),
  patientCase: (
    patientId: string,
    caseId: string,
  ): Promise<PatientCaseDetail> =>
    requestJson(`/patients/${patientId}/cases/${caseId}`),
  acknowledge: (caseId: string, patientId: string): Promise<unknown> =>
    postJson("/cases/acknowledge", { caseId, patientId }),
  markRead: (patientId: string, caseId: string): Promise<unknown> =>
    postJson(`/patients/${patientId}/cases/${caseId}/read`, {}),
  slots: (clinicId: string): Promise<Slot[]> =>
    requestJson(`/clinics/${clinicId}/slots`),
  book: (
    caseId: string,
    slotId: string,
    kind: Slot["kind"],
  ): Promise<Booking> => postJson("/bookings", { caseId, slotId, kind }),
  messages: (patientId: string, caseId: string): Promise<CaseMessage[]> =>
    requestJson(`/patients/${patientId}/cases/${caseId}/messages`),
  sendMessage: (
    patientId: string,
    caseId: string,
    body: string,
  ): Promise<CaseMessage> =>
    postJson(`/patients/${patientId}/cases/${caseId}/messages`, { body }),
  registerDevice: (
    patientId: string,
    token: string,
    platform: string,
  ): Promise<unknown> =>
    postJson(`/patients/${patientId}/devices`, { token, platform }),
  recordEvent: (
    patientId: string,
    type: MobileEventType,
    caseId?: string,
  ): Promise<unknown> =>
    postJson(`/patients/${patientId}/events`, { type, caseId }),
  markNotificationRead: (
    patientId: string,
    notificationId: string,
  ): Promise<unknown> =>
    postJson(`/patients/${patientId}/notifications/${notificationId}/read`, {}),
};
