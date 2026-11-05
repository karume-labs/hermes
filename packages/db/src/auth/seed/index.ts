import { account, session, user, verification } from "@db/auth/schema/index";
import { db } from "@db/client";
import { seedEnv } from "@db/seed/env/index";
import type { SeedContext } from "@db/seed/types";
import type { StaffRole } from "@hermes/types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

type DemoAccount = {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
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

const demoAccounts = (): DemoAccount[] => [
  {
    name: "Casey Coordinator",
    email: seedEnv.COORDINATOR_EMAIL,
    password: seedEnv.COORDINATOR_PASSWORD,
    role: "coordinator",
  },
  {
    name: "Avery Admin",
    email: seedEnv.ADMIN_EMAIL,
    password: seedEnv.ADMIN_PASSWORD,
    role: "admin",
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

  for (const demo of demoAccounts()) {
    const existing = await findUserByEmail(demo.email);
    if (existing !== null) {
      await db
        .update(user)
        .set({ role: demo.role })
        .where(eq(user.id, existing.id));
      console.log(`    ${demo.email} already exists (role ${demo.role}).`);
      continue;
    }

    const response = await seedAuthInstance.api.signUpEmail({
      body: { email: demo.email, password: demo.password, name: demo.name },
      headers: new Headers(),
    });

    if (response.user === undefined || response.user === null) {
      console.error(`    Failed to create ${demo.email}.`);
      continue;
    }

    await db
      .update(user)
      .set({ role: demo.role })
      .where(eq(user.id, response.user.id));
    created += 1;
    console.log(`    ${demo.email} seeded with role ${demo.role}.`);
  }

  return created;
};
