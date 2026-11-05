import {
  findCase,
  logAudit,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import { assertCoordinator } from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { CloseCaseSchema, ReferralSchema } from "@hermes/validators";
import { Elysia, t } from "elysia";

const authHeader = t.Object({
  authorization: t.Optional(t.String()),
  cookie: t.Optional(t.String()),
});

export const referralsRouter = new Elysia()
  .post(
    "/referrals",
    async ({ body, headers }) => {
      await assertCoordinator(headers);
      const found = await findCase(body.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      if (found.status === "closed")
        throw new ConflictError("Case already closed");
      const updated = await updateCase(found.id, {
        referralClinicId: body.toClinicId,
        status: "referred",
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await logAudit(updated.id, "coordinator", "referral_linked", body);
      return updated;
    },
    { body: ReferralSchema, headers: authHeader },
  )
  .post(
    "/cases/close",
    async ({ body, headers }) => {
      await assertCoordinator(headers);
      const found = await findCase(body.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      const updated = await updateCase(found.id, {
        status: "closed",
        closedAt: new Date(),
        closurePlan: body.plan,
        closureEvidence: body.evidence,
        closedBy: body.clinicianId,
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await logAudit(
        updated.id,
        `clinician:${body.clinicianId}`,
        "case_closed",
        {
          evidence: body.evidence,
          plan: body.plan,
        },
      );
      return updated;
    },
    { body: CloseCaseSchema, headers: authHeader },
  );
