import { type Static, Type } from "@sinclair/typebox";

export const staffRoleSchema = Type.Union([
  Type.Literal("coordinator"),
  Type.Literal("clinician"),
  Type.Literal("admin"),
]);

export const signInBody = Type.Object({
  email: Type.String({
    format: "email",
    minLength: 3,
    error: "Enter the email address your clinic issued you.",
  }),
  password: Type.String({
    minLength: 8,
    error: "Passwords are at least 8 characters.",
  }),
});

export const signInBodySchema = signInBody;
export type SignInBody = Static<typeof signInBody>;

export const staffSessionSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  role: staffRoleSchema,
  lastSignInAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const sessionResponseSchema = Type.Object({
  user: staffSessionSchema,
  expiresAt: Type.String(),
});

// Staff are invited by an admin; public sign-up stays disabled.
export const createStaffInviteSchema = Type.Object({
  email: Type.String({ format: "email", minLength: 3 }),
  name: Type.String({ minLength: 2, maxLength: 80 }),
  role: staffRoleSchema,
  clinicId: Type.Optional(Type.String({ minLength: 1 })),
});
export type CreateStaffInvite = Static<typeof createStaffInviteSchema>;
export const CreateStaffInviteSchema = createStaffInviteSchema;

export const acceptStaffInviteSchema = Type.Object({
  token: Type.String({ minLength: 16 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
});
export type AcceptStaffInvite = Static<typeof acceptStaffInviteSchema>;
export const AcceptStaffInviteSchema = acceptStaffInviteSchema;

export const updateStaffUserSchema = Type.Object({
  role: Type.Optional(staffRoleSchema),
  clinicId: Type.Optional(
    Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  ),
  banned: Type.Optional(Type.Boolean()),
  banReason: Type.Optional(
    Type.Union([Type.String({ maxLength: 400 }), Type.Null()]),
  ),
});
export type UpdateStaffUser = Static<typeof updateStaffUserSchema>;
export const UpdateStaffUserSchema = updateStaffUserSchema;
