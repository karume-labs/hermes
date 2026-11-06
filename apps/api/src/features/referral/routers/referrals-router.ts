import { releaseCaseBooking } from "@api/features/booking/services/booking-repository";
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
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import { CloseCaseSchema, ReferralSchema } from "@hermes/validators";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

const assertActiveClinic = async (clinicId: string): Promise<void> => {
  const [clinic] = await db
    .select({ id: clinics.id, isActive: clinics.isActive })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);
  if (clinic === undefined || !clinic.isActive) {
    throw new NotFoundError("Destination clinic not found");
  }
};

const authHeader = t.Object({
  authorization: t.Optional(t.String()),
  cookie: t.Optional(t.String()),
});

export const referralsRouter = new Elysia()
  .post(
    "/referrals",
    async ({ body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findCase(body.caseId, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      if (found.status === "closed")
        throw new ConflictError("Case already closed");
      if (body.toClinicId === found.clinicId) {
        throw new ConflictError("Choose a different clinic to refer to");
      }
      await assertActiveClinic(body.toClinicId);
      const updated = await updateCase(found.id, {
        referralClinicId: body.toClinicId,
        status: "referred",
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await logAudit(
        updated.id,
        `staff:${staff.email}`,
        "referral_linked",
        body,
      );
      return updated;
    },
    { body: ReferralSchema, headers: authHeader },
  )
  .post(
    "/cases/close",
    async ({ body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findCase(body.caseId, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      const updated = await updateCase(found.id, {
        status: "closed",
        closedAt: new Date(),
        closurePlan: body.plan,
        closureEvidence: body.evidence,
        // Attribution comes from the session, never the request body.
        closedBy: staff.email,
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await releaseCaseBooking(found.id);
      await logAudit(updated.id, `staff:${staff.email}`, "case_closed", {
        evidence: body.evidence,
        plan: body.plan,
        requestedClinicianId: body.clinicianId,
        closedBy: staff.email,
      });
      return updated;
    },
    { body: CloseCaseSchema, headers: authHeader },
  );
