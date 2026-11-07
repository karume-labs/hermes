import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { adminRouter } from "@api/features/admin/routers/admin-router";
import { env } from "@api/features/shared/env/index";
import { errorHandlerPlugin } from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import { inArray } from "drizzle-orm";
import { Elysia } from "elysia";

const app = new Elysia().use(errorHandlerPlugin).use(adminRouter);

const suffix = `${Date.now()}`;
const createdId = `itest-admin-clinic-${suffix}`;
const otherId = `itest-admin-other-${suffix}`;

const call = (
  path: string,
  init: RequestInit = {},
  token: string = env.API_SECRET,
) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...init.headers,
      },
    }),
  );

const postClinic = (body: unknown) =>
  call("/admin/clinics", { method: "POST", body: JSON.stringify(body) });

const patchClinic = (id: string, body: unknown) =>
  call(`/admin/clinics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

interface ClinicBody {
  id: string;
  name: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

describe("admin clinic directory", () => {
  beforeAll(async () => {
    await db.delete(clinics).where(inArray(clinics.id, [createdId, otherId]));
  });

  afterAll(async () => {
    await db.delete(clinics).where(inArray(clinics.id, [createdId, otherId]));
  });

  test("an administrator can create a clinic", async () => {
    const response = await postClinic({
      id: createdId,
      name: "Itest Hillcrest Clinic",
      timezone: "Africa/Nairobi",
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as ClinicBody;
    expect(body.id).toBe(createdId);
    expect(body.name).toBe("Itest Hillcrest Clinic");
    expect(body.timezone).toBe("Africa/Nairobi");
    expect(body.isActive).toBe(true);

    const listed = await call("/admin/clinics");
    expect(listed.status).toBe(200);
    const rows = (await listed.json()) as Array<{
      id: string;
      patientCount: number;
      staffCount: number;
      openCaseCount: number;
    }>;
    const created = rows.find((row) => row.id === createdId);
    expect(created).toBeDefined();
    expect(created?.patientCount).toBe(0);
    expect(created?.staffCount).toBe(0);
    expect(created?.openCaseCount).toBe(0);
  });

  test("a duplicate clinic id is refused", async () => {
    const response = await postClinic({
      id: createdId,
      name: "Another name entirely",
    });

    expect(response.status).toBe(409);
  });

  test("an administrator can rename and pause a clinic", async () => {
    const response = await patchClinic(createdId, {
      name: "Itest Hillcrest Annex",
      timezone: "Africa/Kampala",
      isActive: false,
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as ClinicBody;
    expect(body.name).toBe("Itest Hillcrest Annex");
    expect(body.timezone).toBe("Africa/Kampala");
    expect(body.isActive).toBe(false);

    const resumed = await patchClinic(createdId, { isActive: true });
    expect(resumed.status).toBe(200);
    expect(((await resumed.json()) as ClinicBody).isActive).toBe(true);
  });

  test("editing an unknown clinic reports not found", async () => {
    expect((await patchClinic(otherId, { name: "Ghost clinic" })).status).toBe(
      404,
    );
  });

  test("the directory is closed without the service secret", async () => {
    const rejected = await app.handle(
      new Request("http://localhost/admin/clinics", { method: "GET" }),
    );
    expect(rejected.status).toBe(401);

    const badSecret = await call(
      "/admin/clinics",
      { method: "GET" },
      "not-the-secret",
    );
    expect(badSecret.status).toBe(401);
  });
});
