import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { env } from "@api/features/shared/env/index";
import { app } from "@api/index";
import { account, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import {
  type CareLoopFixtures,
  createFixtures,
} from "./helpers/care-loop-fixtures";

const PASSWORD = "itest-password-123";

let fixtures: CareLoopFixtures;
let caseId = "";

const addPassword = async (userId: string): Promise<void> => {
  await db.insert(account).values({
    id: `itest-account-${userId}`,
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(PASSWORD),
  });
};

const emailFor = async (id: string): Promise<string> => {
  const [row] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (row === undefined) throw new Error("Fixture user disappeared");
  return row.email;
};

const signIn = async (email: string): Promise<string> => {
  const response = await app.handle(
    new Request("http://localhost/auth/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: env.FRONTEND_URL,
      },
      body: JSON.stringify({ email, password: PASSWORD }),
    }),
  );
  expect(response.status).toBe(200);
  const cookies = response.headers.get("set-cookie");
  if (cookies === null) throw new Error("Sign-in returned no session cookie");
  const session = cookies
    .split(/,(?=\s*[^;]+=)/)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .find((cookie) => cookie?.includes("session_token"));
  if (session === undefined) throw new Error("No session cookie in response");
  return session;
};

const call = async (
  path: string,
  headers: Record<string, string> = {},
): Promise<Response> =>
  app.handle(
    new Request(`http://localhost${path}`, { method: "GET", headers }),
  );

// One authenticated request per role: the API guard matrix is what the
// dashboard depends on, and role mistakes here are silent otherwise.
describe("staff routes by role", () => {
  beforeAll(async () => {
    fixtures = await createFixtures("staff-routes");
    const careCase = await fixtures.createCase();
    caseId = careCase.id;
    await addPassword(fixtures.coordinatorId);
    await addPassword(fixtures.clinicianId);
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  test("a clinician session opens the consult thread", async () => {
    const cookie = await signIn(await emailFor(fixtures.clinicianId));
    const response = await call(`/cases/${caseId}/consult-notes`, { cookie });
    expect(response.status).toBe(200);
  });

  test("a coordinator session is refused the consult thread", async () => {
    const cookie = await signIn(await emailFor(fixtures.coordinatorId));
    const response = await call(`/cases/${caseId}/consult-notes`, { cookie });
    expect(response.status).toBe(401);
  });

  test("a coordinator session is refused an admin route", async () => {
    const cookie = await signIn(await emailFor(fixtures.coordinatorId));
    const response = await call("/staff/users", { cookie });
    expect(response.status).toBe(401);
  });

  test("the service credential reaches an admin route", async () => {
    const response = await call("/staff/users", {
      authorization: `Bearer ${env.API_SECRET}`,
    });
    expect(response.status).toBe(200);
  });

  test("no credential is refused", async () => {
    const response = await call(`/cases/${caseId}/consult-notes`);
    expect(response.status).toBe(401);
  });
});
