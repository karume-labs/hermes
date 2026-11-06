import { type Static, Type } from "@sinclair/typebox";

export const deviceTokenSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  platform: Type.Union([
    Type.Literal("ios"),
    Type.Literal("android"),
    Type.Literal("web"),
  ]),
});
export const DeviceTokenSchema = deviceTokenSchema;
export type DeviceTokenBody = Static<typeof deviceTokenSchema>;

export const mobileEventSchema = Type.Object({
  type: Type.Union([
    Type.Literal("app_open"),
    Type.Literal("push_opened"),
    Type.Literal("case_viewed"),
    Type.Literal("booking_confirmed"),
    Type.Literal("message_sent"),
  ]),
  caseId: Type.Optional(Type.String()),
});
export const MobileEventSchema = mobileEventSchema;
export type MobileEventBody = Static<typeof mobileEventSchema>;

export const notificationReadSchema = Type.Object({
  notificationId: Type.String({ minLength: 1 }),
});
export type NotificationReadBody = Static<typeof notificationReadSchema>;

/** E.164 phone number, the patient's login identity. */
export const patientPhoneSchema = Type.String({
  pattern: "^\\+[1-9][0-9]{7,14}$",
  error: "Enter your phone number with the country code, e.g. +254712345678.",
});

export const patientCodeSchema = Type.String({
  pattern: "^[0-9]{6}$",
  error: "Enter the 6-digit code from the SMS.",
});

export const patientCodeRequestSchema = Type.Object({
  phone: patientPhoneSchema,
});
export type PatientCodeRequest = Static<typeof patientCodeRequestSchema>;
export const PatientCodeRequestSchema = patientCodeRequestSchema;

export const patientCodeVerifySchema = Type.Object({
  phone: patientPhoneSchema,
  code: patientCodeSchema,
});
export type PatientCodeVerify = Static<typeof patientCodeVerifySchema>;
export const PatientCodeVerifySchema = patientCodeVerifySchema;

export const patientConsentSchema = Type.Object({
  pushConsent: Type.Boolean(),
  smsConsent: Type.Boolean(),
});
export type PatientConsent = Static<typeof patientConsentSchema>;
export const PatientConsentSchema = patientConsentSchema;
