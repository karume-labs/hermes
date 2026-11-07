import type * as authSchema from "@hermes/db/auth/schema";
import type { clinics, patients } from "@hermes/db/directory/schema";
import type { patientSessions } from "@hermes/db/patient/schema";
import type { InferSelectModel } from "drizzle-orm";
import type { Serialized } from "./serialized";

/** Better Auth user row; credentials live in `account`, never here. */
export type StaffUser = Serialized<InferSelectModel<typeof authSchema.user>>;

/** Clinic (tenant) row. */
export type Clinic = Serialized<InferSelectModel<typeof clinics>>;

/** Patient directory row; `id` is the clinic's stable patient identifier. */
export type Patient = Serialized<InferSelectModel<typeof patients>>;

/** Patient bearer session (token itself never leaves SecureStore). */
export type PatientSession = Serialized<
  InferSelectModel<typeof patientSessions>
>;

/** Staff invitation row; the raw token is only returned at creation. */
export type StaffInvite = Serialized<
  InferSelectModel<typeof authSchema.staffInvites>
>;

/** Session row as returned by `/auth/get-session`. */
export type AuthSession = Serialized<
  InferSelectModel<typeof authSchema.session>
>;

export type StaffSession = {
  user: StaffUser;
  session: AuthSession;
};
