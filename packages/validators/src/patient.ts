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

// Clinic staff claim a self-registered account by the number the patient
// signed up with.
export const patientLinkSchema = Type.Object({
  phone: patientPhoneSchema,
});
export type PatientLinkBody = Static<typeof patientLinkSchema>;
export const PatientLinkSchema = patientLinkSchema;

export const patientConsentSchema = Type.Object({
  pushConsent: Type.Boolean(),
  smsConsent: Type.Boolean(),
  emailConsent: Type.Optional(Type.Boolean()),
  notificationChannel: Type.Optional(
    Type.Union([
      Type.Literal("email"),
      Type.Literal("in_app"),
      Type.Literal("both"),
    ]),
  ),
});
export type PatientConsent = Static<typeof patientConsentSchema>;
export const PatientConsentSchema = patientConsentSchema;

// Self-service signup: anyone can create an account with their own phone
// number. The clinic link is made by staff when the first result arrives.
export const patientRegisterSchema = Type.Object({
  name: Type.String({
    minLength: 2,
    maxLength: 120,
    error: "Enter the name your clinic knows you by.",
  }),
  phone: patientPhoneSchema,
  email: Type.Optional(Type.String({ format: "email", maxLength: 320 })),
  emailConsent: Type.Optional(Type.Boolean()),
  notificationChannel: Type.Optional(
    Type.Union([
      Type.Literal("email"),
      Type.Literal("in_app"),
      Type.Literal("both"),
    ]),
  ),
});
export type PatientRegister = Static<typeof patientRegisterSchema>;
export const PatientRegisterSchema = patientRegisterSchema;

// Teach-back: did the patient understand the result, and how reassured do
// they feel? Both answers are stored against the case for outcome measures.
export const caseFeedbackSchema = Type.Object({
  understood: Type.Boolean(),
  confidence: Type.Integer({ minimum: 1, maximum: 5 }),
  comment: Type.Optional(Type.String({ maxLength: 500 })),
});
export type CaseFeedbackBody = Static<typeof caseFeedbackSchema>;
export const CaseFeedbackSchema = caseFeedbackSchema;
