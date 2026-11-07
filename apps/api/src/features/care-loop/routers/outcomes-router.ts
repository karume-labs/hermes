import { outcomeConsultRoutes } from "@api/features/care-loop/routers/outcome-consult-routes";
import { outcomeMilestoneRoutes } from "@api/features/care-loop/routers/outcome-milestone-routes";
import { Elysia } from "elysia";

export const outcomesRouter = new Elysia()
  .use(outcomeConsultRoutes)
  .use(outcomeMilestoneRoutes);
