import { listAudit } from "@api/features/care-loop/services/case-repository";
import { buildMetrics } from "@api/features/metrics/services/metrics-service";
import { Elysia } from "elysia";

export const metricsRouter = new Elysia()
  .get("/metrics", () => buildMetrics())
  .get("/audit/:caseId", ({ params }) => listAudit(params.caseId));
