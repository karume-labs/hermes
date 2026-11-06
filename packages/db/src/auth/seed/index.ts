import { account, session, user, verification } from "@db/auth/schema/index";
import { db } from "@db/client";
import { seedEnv } from "@db/seed/env/index";
import type { SeedContext } from "@db/seed/types";
import type { StaffRole } from "@hermes/types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword } from "better-auth/crypto";
import { admin } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";

type SeedAccount = {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  clinicId: string | null;
};

// Vaunt pattern: seed accounts through Better Auth itself so the password row is
// hashed and linked in `account` exactly as a real sign-up would.
const seedAuthInstance = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, account, session, verification },
  }),
  secret: seedEnv.BETTER_AUTH_SECRET,
  baseURL: `${seedEnv.API_URL}/auth`,
  emailAndPassword: { enabled: true },
  plugins: [admin({ defaultRole: "coordinator", adminRoles: ["admin"] })],
});

const seedAccounts = (): SeedAccount[] => [
  {
    name: "Casey Coordinator",
    email: seedEnv.COORDINATOR_EMAIL,
    password: seedEnv.COORDINATOR_PASSWORD,
    role: "coordinator",
    clinicId: "clinic-1",
  },
  {
    name: "Avery Admin",
    email: seedEnv.ADMIN_EMAIL,
    password: seedEnv.ADMIN_PASSWORD,
    role: "admin",
    clinicId: null,
  },
  {
    name: "Dr. Ada Okafor",
    email: seedEnv.CLINICIAN_EMAIL,
    password: seedEnv.CLINICIAN_PASSWORD,
    role: "clinician",
    clinicId: "clinic-1",
  },
];

const findUserByEmail = async (email: string) => {
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return found ?? null;
};

export const seedAuth = async (_context: SeedContext): Promise<number> => {
  let created = 0;

  for (const accountSeed of seedAccounts()) {
    const existing = await findUserByEmail(accountSeed.email);
    if (existing !== null) {
      await db
        .update(user)
        .set({ role: accountSeed.role, clinicId: accountSeed.clinicId })
        .where(eq(user.id, existing.id));
      // Keep the seeded password in step with the configured one, so changing
      // the default does not strand an existing database on the old credential.
      await db
        .update(account)
        .set({ password: await hashPassword(accountSeed.password) })
        .where(
          and(
            eq(account.userId, existing.id),
            eq(account.providerId, "credential"),
          ),
        );
      console.log(
        `    ${accountSeed.email} already exists (role ${accountSeed.role}, password refreshed).`,
      );
      continue;
    }

    const response = await seedAuthInstance.api.signUpEmail({
      body: {
        email: accountSeed.email,
        password: accountSeed.password,
        name: accountSeed.name,
      },
      headers: new Headers(),
    });

    if (response.user === undefined || response.user === null) {
      console.error(`    Failed to create ${accountSeed.email}.`);
      continue;
    }

    await db
      .update(user)
      .set({ role: accountSeed.role, clinicId: accountSeed.clinicId })
      .where(eq(user.id, response.user.id));
    created += 1;
    console.log(
      `    ${accountSeed.email} seeded with role ${accountSeed.role}.`,
    );
  }

  return created;
};
