import { env } from "@api/features/shared/env/index";
import { account, session, user, verification } from "@db/auth/schema/index";
import { db } from "@db/client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

const googleConfigured =
  env.GOOGLE_CLIENT_ID !== "" && env.GOOGLE_CLIENT_SECRET !== "";

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

  rateLimit: { enabled: false },

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

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  socialProviders: googleConfigured
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {},

  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  plugins: [admin({ defaultRole: "coordinator", adminRoles: ["admin"] })],
});

export const googleSignInEnabled = googleConfigured;
