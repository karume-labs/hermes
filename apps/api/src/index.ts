import { auth } from "@api/features/auth/services/config";
import { bookingsRouter } from "@api/features/booking/routers/bookings-router";
import { queueVisitReminders } from "@api/features/booking/services/reminder-service";
import { casesRouter } from "@api/features/care-loop/routers/cases-router";
import {
  attachmentDownloadRouter,
  caseAttachmentsRouter,
} from "@api/features/documents/routers/attachments-router";
import { ensureUploadsDirectory } from "@api/features/documents/services/storage";
import { ingestionRouter } from "@api/features/ingestion/routers/ingestion-router";
import { metricsRouter } from "@api/features/metrics/routers/metrics-router";
import {
  notifyRouter,
  webhookLogRouter,
} from "@api/features/notify/routers/notify-router";
import { dispatchPending } from "@api/features/notify/services/notification-service";
import { patientsRouter } from "@api/features/patient/routers/patients-router";
import { referralsRouter } from "@api/features/referral/routers/referrals-router";
import { env } from "@api/features/shared/env/index";
import { errorHandlerPlugin } from "@api/features/shared/errors/index";
import { runSlaSweep } from "@api/features/shared/services/sla-sweep";
import { cors } from "@elysiajs/cors";
import { Cron } from "croner";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";

export const app = new Elysia()
  .use(errorHandlerPlugin)
  // Credentials are required: the dashboard's session cookie rides along on
  // every Eden call, and a wildcard origin cannot carry cookies.
  .use(cors({ origin: true, credentials: true }))
  .use(helmet())
  .get("/health", () => ({ ok: true, time: new Date().toISOString() }))
  // Better Auth owns /auth/* (sign-up, sign-in, Google callbacks, session, sign-out).
  .all("/auth/*", ({ request }) => auth.handler(request))
  .use(ingestionRouter)
  .use(casesRouter)
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
  await runSlaSweep(new Date());
  await queueVisitReminders(new Date());
  await dispatchPending();
});

const isMain = (import.meta as unknown as { main?: boolean }).main;
if (isMain) {
  await ensureUploadsDirectory();
  app.listen(Number(env.PORT));
  console.log(`API listening on :${env.PORT}`);
}

export type App = typeof app;
