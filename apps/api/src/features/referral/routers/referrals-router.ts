import { releaseCaseBooking } from "@api/features/booking/services/booking-cancel";
import {
  findCase,
  logAudit,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import {
  acceptReferral,
  completeReferral,
  createReferral,
  declineReferral,
  listReferrals,
} from "@api/features/care-loop/services/referral-service";
import { closeTasks } from "@api/features/care-loop/services/task-service";
import {
  assertClinician,
  assertCoordinator,
  requireStaff,
} from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import {
  CloseCaseSchema,
  ReferralDecisionSchema,
  ReferralSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

const referralParams = Type.Object({ id: Type.String({ minLength: 1 }) });

export const referralsRouter = new Elysia()
  .get(
    "/referrals",
    async ({ query, headers }) => {
      const staff = await requireStaff(headers);
      const direction =
        query.direction === "incoming" || query.direction === "outgoing"
          ? query.direction
          : "all";
      return listReferrals(staff, direction);
    },
    {
      query: Type.Object({ direction: Type.Optional(Type.String()) }),
      headers: authHeader,
    },
  )
  .post(
    "/referrals",
    async ({ body, headers }) => {
      const staff = await assertCoordinator(headers);
      return createReferral(staff, body);
    },
    { body: ReferralSchema, headers: authHeader },
  )
  .post(
    "/referrals/:id/accept",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      return acceptReferral(staff, params.id, body);
    },
    {
      params: referralParams,
      body: ReferralDecisionSchema,
      headers: authHeader,
    },
  )
  .post(
    "/referrals/:id/decline",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      return declineReferral(staff, params.id, body.reason);
    },
    {
      params: referralParams,
      body: ReferralDecisionSchema,
      headers: authHeader,
    },
  )
  .post(
    "/referrals/:id/complete",
    async ({ params, headers }) => {
      const staff = await assertCoordinator(headers);
      return completeReferral(staff, params.id);
    },
    { params: referralParams, headers: authHeader },
  )
  .post(
    "/cases/close",
    async ({ body, headers }) => {
      // Closure is a clinical act: coordinators can prepare the record but only
      // a clinician or administrator can sign it.
      const staff = await assertClinician(headers);
      const found = await findCase(body.caseId, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      // Closure is the end of a chain of accountability, so someone must own it.
      if (found.assignedToId === null) {
        throw new ConflictError(
          "Assign the case to a staff owner before closing",
        );
      }
      const updated = await updateCase(found.id, {
        status: "closed",
        closedAt: new Date(),
        closurePlan: body.plan,
        closureEvidence: body.evidence,
        closedBy: staff.email,
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await releaseCaseBooking(found.id);
      await closeTasks(
        found.id,
        ["escalation", "overdue", "referral"],
        staff.email,
      );
      await logAudit(updated.id, `staff:${staff.email}`, "case_closed", {
        evidence: body.evidence,
        plan: body.plan,
        closedBy: staff.email,
      });
      return updated;
    },
    { body: CloseCaseSchema, headers: authHeader },
  );
