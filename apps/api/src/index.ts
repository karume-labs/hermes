import { adminRouter } from "@api/features/admin/routers/admin-router";
import { auth } from "@api/features/auth/services/config";
import { bookingsRouter } from "@api/features/booking/routers/bookings-router";
import { queueVisitReminders } from "@api/features/booking/services/reminder-service";
import { casesRouter } from "@api/features/care-loop/routers/cases-router";
import {
  outcomesRouter,
  tasksRouter,
} from "@api/features/care-loop/routers/outcomes-router";
import { clinicRouter } from "@api/features/clinic/routers/clinic-router";
import { directoryRouter } from "@api/features/directory/routers/directory-router";
import {
  attachmentDownloadRouter,
  caseAttachmentsRouter,
} from "@api/features/documents/routers/attachments-router";
import { ensureUploadsDirectory } from "@api/features/documents/services/storage";
import { ingestionRouter } from "@api/features/ingestion/routers/ingestion-router";
import { pruneWebhookReceipts } from "@api/features/ingestion/services/webhook-auth";
import { metricsRouter } from "@api/features/metrics/routers/metrics-router";
import {
  notifyRouter,
  webhookLogRouter,
} from "@api/features/notify/routers/notify-router";
import { dispatchPending } from "@api/features/notify/services/notification-service";
import { patientsRouter } from "@api/features/patient/routers/patients-router";
import { patientAuthRouter } from "@api/features/patient-auth/routers/patient-auth-router";
import { referralsRouter } from "@api/features/referral/routers/referrals-router";
import { env } from "@api/features/shared/env/index";
import { errorHandlerPlugin } from "@api/features/shared/errors/index";
import { observabilityPlugin } from "@api/features/shared/observability";
import { runSlaSweep } from "@api/features/shared/services/sla-sweep";
import { staffRouter } from "@api/features/staff/routers/staff-router";
import { db } from "@db/client";
import { cors } from "@elysiajs/cors";
import { Cron } from "croner";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";

const allowedOrigins = [env.FRONTEND_URL];

export const app = new Elysia()
  .use(observabilityPlugin)
  .use(errorHandlerPlugin)
  // Credentials are required: the dashboard's session cookie rides along on
  // every Eden call, so the origin must be an explicit allow-list.
  .use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .use(helmet())
  .get("/health", () => ({ ok: true, time: new Date().toISOString() }))
  .get("/ready", async ({ set }) => {
    try {
      await db.execute(sql`select 1`);
      return { ok: true };
    } catch {
      set.status = 503;
      return { ok: false, database: "unavailable" };
    }
  })
  // Better Auth owns /auth/* (sign-up, sign-in, Google callbacks, session, sign-out).
  .all("/auth/*", ({ request }) => auth.handler(request))
  .use(patientAuthRouter)
  .use(staffRouter)
  .use(clinicRouter)
  .use(adminRouter)
  .use(directoryRouter)
  .use(ingestionRouter)
  .use(casesRouter)
  .use(outcomesRouter)
  .use(tasksRouter)
  .use(caseAttachmentsRouter)
  .use(attachmentDownloadRouter)
  .use(bookingsRouter)
  .use(patientsRouter)
  .use(referralsRouter)
  .use(metricsRouter)
  .use(notifyRouter)
  .use(webhookLogRouter);

// One five-minute tick owns the safety nets: SLA escalation, 24h visit
// reminders and the outbox drain.
new Cron("*/5 * * * *", async () => {
  try {
    await runSlaSweep(new Date());
    await queueVisitReminders(new Date());
    await dispatchPending();
    await pruneWebhookReceipts();
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "background_job_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
});

const isMain = (import.meta as unknown as { main?: boolean }).main;
if (isMain) {
  await ensureUploadsDirectory();
  app.listen(Number(env.PORT));
  console.log(`API listening on :${env.PORT}`);

  // Let the proxy drain before the process exits.
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down`);
    await app.stop();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

export type App = typeof app;
