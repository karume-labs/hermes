import { type Static, Type } from "@sinclair/typebox";

export const clinicUpdateSchema = Type.Object({
  isActive: Type.Boolean(),
});
export type ClinicUpdate = Static<typeof clinicUpdateSchema>;
export const ClinicUpdateSchema = clinicUpdateSchema;
