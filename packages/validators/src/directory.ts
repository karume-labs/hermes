import { type Static, Type } from "@sinclair/typebox";

export const clinicCreateSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 2 }),
  timezone: Type.Optional(Type.String({ minLength: 1 })),
  isActive: Type.Optional(Type.Boolean()),
});
export type ClinicCreate = Static<typeof clinicCreateSchema>;
export const ClinicCreateSchema = clinicCreateSchema;

export const clinicUpdateSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2 })),
  timezone: Type.Optional(Type.String({ minLength: 1 })),
  isActive: Type.Optional(Type.Boolean()),
});
export type ClinicUpdate = Static<typeof clinicUpdateSchema>;
export const ClinicUpdateSchema = clinicUpdateSchema;
