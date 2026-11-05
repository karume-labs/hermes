import { fromFhirObservation } from "@api/features/ingestion/services/fhir";
import { parseHl7Oru } from "@api/features/ingestion/services/hl7";
import { ingestLab } from "@api/features/ingestion/services/ingest-service";
import {
  listRoutingRules,
  removeRoutingRule,
  upsertRoutingRule,
} from "@api/features/ingestion/services/routing-service";
import { recordWebhook } from "@api/features/notify/services/notification-service";
import { assertCoordinator } from "@api/features/shared/auth/index";
import { UnprocessableError } from "@api/features/shared/errors/index";
import {
  type FhirObservationInput,
  FhirObservationSchema,
  Hl7MessageSchema,
  LabResultSchema,
  RoutingRuleSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

const logFailure = async (source: string, error: unknown) => {
  await recordWebhook(source, false, "rejected", {
    error: error instanceof Error ? error.message : "unknown",
  });
};

// TypeBox validation errors carry a short `summary`; the raw message is a JSON
// dump, which is unreadable in the admin audit table.
const validationMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return "Schema validation failed";
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (typeof parsed === "object" && parsed !== null && "summary" in parsed) {
      const summary = parsed.summary;
      if (typeof summary === "string") return summary;
    }
  } catch {
    // Not the JSON envelope Elysia uses — fall through to the raw message.
  }
  return error.message.slice(0, 300);
};

const webhookSourceFor = (path: string): string | null => {
  if (path === "/webhooks/lab") return "lab";
  if (path === "/webhooks/fhir") return "fhir";
  if (path === "/webhooks/hl7") return "hl7";
  return null;
};

// Registered before the routes so it also covers schema-validation failures,
// which never reach a handler: the admin audit must see rejected feeds too.
export const ingestionRouter = new Elysia()
  .onError(async ({ code, error, request }) => {
    const source = webhookSourceFor(new URL(request.url).pathname);
    if (source === null || code !== "VALIDATION") return;
    await recordWebhook(source, false, "rejected", {
      error: validationMessage(error),
    });
  })
  .post(
    "/webhooks/lab",
    async ({ body }) => {
      try {
        const result = await ingestLab({
          patientId: body.patientId,
          clinicId: body.clinicId,
          markerCode: body.markerCode,
          markerValue: body.markerValue,
          unit: body.unit,
          takenAt: body.takenAt,
          facilityId: body.facilityId,
          sourceMessageId: body.rawHl7Fhir ?? `lab_${crypto.randomUUID()}`,
        });
        await recordWebhook("lab", true, "accepted", {
          caseId: result.caseId,
          duplicate: result.duplicate,
        });
        return result;
      } catch (error) {
        await logFailure("lab", error);
        throw error;
      }
    },
    { body: LabResultSchema },
  )
  .post(
    "/webhooks/fhir",
    async ({ body }) => {
      try {
        const observation: FhirObservationInput = body;
        const result = await ingestLab(fromFhirObservation(observation));
        await recordWebhook("fhir", true, "accepted", {
          caseId: result.caseId,
          duplicate: result.duplicate,
        });
        return result;
      } catch (error) {
        await logFailure("fhir", error);
        throw error;
      }
    },
    { body: FhirObservationSchema },
  )
  .post(
    "/webhooks/hl7",
    async ({ body }) => {
      try {
        const labs = parseHl7Oru(body.message).map((lab) => ({
          ...lab,
          clinicId: lab.clinicId ?? body.clinicId ?? null,
        }));
        if (labs.length === 0)
          throw new UnprocessableError("No results in HL7 message");
        const results = await Promise.all(labs.map(ingestLab));
        await recordWebhook("hl7", true, "accepted", {
          caseIds: results.map((result) => result.caseId),
        });
        return results;
      } catch (error) {
        await logFailure("hl7", error);
        throw error;
      }
    },
    { body: Hl7MessageSchema },
  )
  .get("/routing-rules", () => listRoutingRules())
  .put(
    "/routing-rules",
    async ({ body, headers }) => {
      await assertCoordinator(headers);
      return upsertRoutingRule(body);
    },
    { body: RoutingRuleSchema, headers: authHeader },
  )
  .delete(
    "/routing-rules/:id",
    async ({ params, headers }) => {
      await assertCoordinator(headers);
      const removed = await removeRoutingRule(params.id);
      return { removed };
    },
    { headers: authHeader },
  );
