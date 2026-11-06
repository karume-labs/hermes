import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import data from "./data.json";

const PatientSeed = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  phone: Type.String({ pattern: "^\\+[1-9][0-9]{7,14}$" }),
  dateOfBirth: Type.Optional(Type.String()),
});

const seededPatients = Value.Parse(Type.Array(PatientSeed), data.patients);

// The seeded ids encode their home clinic (`patient-4-clinic-1`); production
// patient ids come from the clinic's own numbering and use this table instead.
const clinicFor = (patientId: string): string =>
  patientId.endsWith("-clinic-2") ? "clinic-2" : "clinic-1";

export const seedDirectory = async (context: SeedContext): Promise<number> => {
  for (const clinic of context.clinics) {
    await db
      .insert(clinics)
      .values({
        id: clinic.id,
        name: clinic.name,
        timezone: "Africa/Nairobi",
      })
      .onConflictDoUpdate({
        target: clinics.id,
        set: { name: clinic.name },
      });
  }

  for (const patient of seededPatients) {
    const clinicId = clinicFor(patient.id);
    const values = {
      id: patient.id,
      clinicId,
      name: patient.name,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth ?? null,
      pushConsent: true,
      smsConsent: true,
    };
    await db
      .insert(patients)
      .values(values)
      .onConflictDoUpdate({
        target: patients.id,
        set: {
          clinicId: values.clinicId,
          name: values.name,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth,
          pushConsent: values.pushConsent,
          smsConsent: values.smsConsent,
        },
      });
  }

  // Backfilled rows (from a pre-005 database) that are not in the seed file
  // keep their placeholder names; only ids present above are touched.
  return context.clinics.length + seededPatients.length;
};
