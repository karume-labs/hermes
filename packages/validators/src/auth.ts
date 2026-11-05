import { type Static, Type } from "@sinclair/typebox";

export const staffRoleSchema = Type.Union([
  Type.Literal("coordinator"),
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

export const signUpBody = Type.Object({
  name: Type.String({
    minLength: 2,
    maxLength: 80,
    error: "Enter the full name you use at the clinic.",
  }),
  email: Type.String({
    format: "email",
    minLength: 3,
    error: "Enter the email address your clinic issued you.",
  }),
  password: Type.String({
    minLength: 8,
    maxLength: 128,
    error: "Passwords need at least 8 characters.",
  }),
});

export const signUpBodySchema = signUpBody;
export type SignUpBody = Static<typeof signUpBody>;
