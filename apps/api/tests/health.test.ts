import { describe, expect, test } from "bun:test";
import { app } from "@api/index";

describe("service health", () => {
  test("health answers without touching the database", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  test("readiness proves the database connection", async () => {
    const response = await app.handle(new Request("http://localhost/ready"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });
});
