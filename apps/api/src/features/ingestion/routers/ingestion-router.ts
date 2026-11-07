import { demoResultRoutes } from "@api/features/ingestion/routers/demo-result-routes";
import { routingRoutes } from "@api/features/ingestion/routers/routing-routes";
import {
  logFailure,
  validationMessage,
  webhookSourceFor,
} from "@api/features/ingestion/routers/webhook-guard";
import { fromFhirObservation } from "@api/features/ingestion/services/fhir";
import { parseHl7Oru } from "@api/features/ingestion/services/hl7";
import { ingestLab } from "@api/features/ingestion/services/ingest-service";
import {
  rememberRawBody,
  verifyWebhook,
} from "@api/features/ingestion/services/webhook-auth";
import { recordWebhook } from "@api/features/notify/services/notification-webhooks";
import { UnprocessableError } from "@api/features/shared/errors/index";
import {
  type FhirObservationInput,
  FhirObservationSchema,
  Hl7MessageSchema,
  LabResultSchema,
} from "@hermes/validators";
import { Elysia } from "elysia";

// Registered before the routes so it also covers schema-validation failures,
// which never reach a handler: the admin audit must see rejected feeds too.
export const ingestionRouter = new Elysia()
  // Keep the exact bytes the sender signed; the handler verifies against them
  // rather than a re-serialised object whose key order may differ.
  .onParse(async (context, contentType) => {
    if (contentType === null || !contentType.includes("json")) return;
    const raw = await context.request.text();
    rememberRawBody(context.request, raw);
    return JSON.parse(raw);
  })
  .onError(async ({ code, error, request }) => {
    const source = webhookSourceFor(new URL(request.url).pathname);
    if (source === null || code !== "VALIDATION") return;
    await recordWebhook(source, false, "rejected", {
      error: validationMessage(error),
    });
  })
  .post(
    "/webhooks/lab",
    async ({ body, request }) => {
      try {
        await verifyWebhook(request, "lab");
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
    async ({ body, request }) => {
      try {
        await verifyWebhook(request, "fhir");
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
    async ({ body, request }) => {
      try {
        await verifyWebhook(request, "hl7");
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
  .use(routingRoutes)
  .use(demoResultRoutes);
