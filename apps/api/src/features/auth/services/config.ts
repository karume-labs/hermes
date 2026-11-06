import { env } from "@api/features/shared/env/index";
import { account, session, user, verification } from "@db/auth/schema/index";
import { db } from "@db/client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

// Hermes has no Better Auth instance of its own: this is the single source of
// truth for staff identity. Sessions are cookie-backed, accounts are hashed in
// `account`, and the dashboard reads them through `/auth/get-session`.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, account, session, verification },
  }),

  baseURL: `${env.API_URL}/auth`,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],

  // Brute-force protection is on by default; the auth pages hit these limits
  // per IP and per account.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
    },
  },

  advanced: {
    // The dashboard (:3100) and the API (:18003) are different origins on the
    // same host, so the session cookie must be usable cross-origin.
    crossSubDomainCookies: { enabled: false },
    defaultCookieAttributes: { sameSite: "lax" },
  },

  databaseHooks: {
    user: {
      update: {
        after: async (updated) => {
          // Role changes and bans must invalidate live sessions immediately.
          await db.delete(session).where(eq(session.userId, updated.id));
        },
      },
    },
  },

  // Public sign-up is closed: staff are created through the admin invite flow
  // (see features/staff). `clinicId` is set by that flow, never by the client.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      clinicId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  plugins: [admin({ defaultRole: "coordinator", adminRoles: ["admin"] })],
});
