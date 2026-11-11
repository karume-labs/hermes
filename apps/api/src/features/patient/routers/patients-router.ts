import { patientCaseRoutes } from "@api/features/patient/routers/patient-case-routes";
import { patientLinkRoutes } from "@api/features/patient/routers/patient-link-routes";
import { patientMessageRoutes } from "@api/features/patient/routers/patient-message-routes";
import { patientWorkspaceRoutes } from "@api/features/patient/routers/patient-workspace-routes";
import { Elysia } from "elysia";

export const patientsRouter = new Elysia()
  .use(patientLinkRoutes)
  .use(patientWorkspaceRoutes)
  .use(patientCaseRoutes)
  .use(patientMessageRoutes);
