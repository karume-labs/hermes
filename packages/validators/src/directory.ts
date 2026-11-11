import { type Static, Type } from "@sinclair/typebox";

export const organizationCreateSchema = Type.Object({
  id: Type.String({
    minLength: 2,
    maxLength: 60,
    pattern: "^[a-z0-9][a-z0-9-]*$",
    error: "Use a lowercase id such as `aar-health`.",
  }),
  name: Type.String({ minLength: 2, maxLength: 120 }),
  isActive: Type.Optional(Type.Boolean()),
});
export type OrganizationCreate = Static<typeof organizationCreateSchema>;
export const OrganizationCreateSchema = organizationCreateSchema;

export const organizationUpdateSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2, maxLength: 120 })),
  isActive: Type.Optional(Type.Boolean()),
});
export type OrganizationUpdate = Static<typeof organizationUpdateSchema>;
export const OrganizationUpdateSchema = organizationUpdateSchema;

export const clinicCreateSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 2 }),
  organizationId: Type.Optional(Type.String({ minLength: 1 })),
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
