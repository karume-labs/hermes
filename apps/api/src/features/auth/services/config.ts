import { env } from "@api/features/shared/env/index";
import { sendPasswordResetEmail } from "@api/features/shared/mail/index";
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
      // The dashboard proxy reads the session on every navigation and every
      // link prefetch, so this read must not share the sign-in budget: a 429
      // here looks exactly like a signed-out visitor and bounces the page.
      "/get-session": { window: 60, max: 600 },
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

  user: {
    additionalFields: {
      clinicId: {
        type: "string",
        required: false,
        input: false,
      },
      organizationId: {
        type: "string",
        required: false,
        input: false,
      },
      notificationChannel: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    // Staff who forget a password get a one-hour link. Delivery failures are
    // surfaced by the mailer, never silently swallowed.",
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
  },

  // No cookie cache: every request re-reads the session row. A cached session
  // would survive the deletion below for its whole TTL, so a banned or
  // re-roled account would keep a working dashboard for minutes.
  session: {
    cookieCache: { enabled: false },
  },

  plugins: [admin({ defaultRole: "coordinator", adminRoles: ["admin"] })],
});
