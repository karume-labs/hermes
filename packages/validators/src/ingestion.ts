import { type Static, Type } from "@sinclair/typebox";

export const labResultSchema = Type.Object({
  patientId: Type.String({ minLength: 1 }),
  clinicId: Type.String({ minLength: 1 }),
  facilityId: Type.String({ minLength: 1 }),
  markerCode: Type.String({ minLength: 1 }),
  markerValue: Type.Number(),
  unit: Type.String(),
  takenAt: Type.String({ format: "date-time" }),
  rawHl7Fhir: Type.Optional(Type.String()),
});
export const LabResultSchema = labResultSchema;
export type LabResultInput = Static<typeof labResultSchema>;

// FHIR R4 Observation subset we ingest. Extra fields are allowed so a real
// lab feed is not rejected for carrying provenance we do not read yet.
export const fhirObservationSchema = Type.Object(
  {
    resourceType: Type.Literal("Observation"),
    id: Type.Optional(Type.String()),
    code: Type.Object({
      text: Type.Optional(Type.String()),
      coding: Type.Optional(
        Type.Array(
          Type.Object({
            system: Type.Optional(Type.String()),
            code: Type.Optional(Type.String()),
            display: Type.Optional(Type.String()),
          }),
        ),
      ),
    }),
    subject: Type.Optional(
      Type.Object({ reference: Type.Optional(Type.String()) }),
    ),
    performer: Type.Optional(
      Type.Array(Type.Object({ reference: Type.Optional(Type.String()) })),
    ),
    valueQuantity: Type.Object({
      value: Type.Number(),
      unit: Type.Optional(Type.String()),
    }),
    effectiveDateTime: Type.Optional(Type.String()),
    clinicId: Type.Optional(Type.String()),
  },
  { additionalProperties: true },
);
export const FhirObservationSchema = fhirObservationSchema;
export type FhirObservationInput = Static<typeof fhirObservationSchema>;

export const hl7MessageSchema = Type.Object({
  message: Type.String({ minLength: 1 }),
  clinicId: Type.Optional(Type.String()),
});
export const Hl7MessageSchema = hl7MessageSchema;
export type Hl7MessageInput = Static<typeof hl7MessageSchema>;

export const routingRuleSchema = Type.Object({
  markerPrefix: Type.String({
    minLength: 1,
    maxLength: 64,
    error: "Use the marker prefix the lab sends (for example `hba1c`).",
  }),
  clinicId: Type.String({
    minLength: 1,
    error: "Name the clinic that should own this marker.",
  }),
  active: Type.Optional(Type.Boolean({ default: true })),
});
export const RoutingRuleSchema = routingRuleSchema;

/** Routing rule composer used by the admin form. */
export const routingRuleForm = Type.Object({
  markerPrefix: routingRuleSchema.properties.markerPrefix,
  clinicId: routingRuleSchema.properties.clinicId,
  // The composer always saves an active rule; keeping this optional keeps the
  // form validator from failing on a field the form never renders.
  active: routingRuleSchema.properties.active,
});
export type RoutingRuleForm = Static<typeof routingRuleForm>;
export type RoutingRuleBody = Static<typeof routingRuleSchema>;
