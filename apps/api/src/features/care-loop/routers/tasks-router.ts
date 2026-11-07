import {
  authHeader,
  idParams,
} from "@api/features/care-loop/routers/outcome-shared";
import { listTasks } from "@api/features/care-loop/services/task-queries";
import { completeTask } from "@api/features/care-loop/services/task-service";
import { requireStaff } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

export const tasksRouter = new Elysia({ prefix: "/tasks" })
  .get(
    "/",
    async ({ query, headers }) => {
      const staff = await requireStaff(headers);
      return listTasks(staff, {
        caseId: query.caseId,
        status: query.status === "done" ? "done" : "open",
      });
    },
    {
      query: Type.Object({
        caseId: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
      headers: authHeader,
    },
  )
  .post(
    "/:id/complete",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      const done = await completeTask(staff, params.id);
      if (done === null) throw new NotFoundError("Task not found");
      return done;
    },
    { params: idParams, headers: authHeader },
  );
