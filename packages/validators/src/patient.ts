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
