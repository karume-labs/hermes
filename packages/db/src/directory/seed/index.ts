import { db } from "@db/client";
import { clinics, organizations, patients } from "@db/directory/schema/index";
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

// Two organizations own the demo directory: a community health network with
// two clinics, and a specialist practice. `specialty-1` is the second org so
// cross-organization referrals have a real boundary to test against.
const ORGANIZATIONS = [
  { id: "hermes-network", name: "Hermes Community Network" },
  { id: "meridian-health", name: "Meridian Health Partners" },
] as const;

const organizationFor = (clinicId: string): string =>
  clinicId === "specialty-1" ? "meridian-health" : "hermes-network";

const clinicFor = (patientId: string): string =>
  patientId.endsWith("-clinic-2") ? "clinic-2" : "clinic-1";

export const seedDirectory = async (context: SeedContext): Promise<number> => {
  for (const organization of ORGANIZATIONS) {
    await db
      .insert(organizations)
      .values({ id: organization.id, name: organization.name })
      .onConflictDoUpdate({
        target: organizations.id,
        set: { name: organization.name },
      });
  }

  for (const clinic of context.clinics) {
    await db
      .insert(clinics)
      .values({
        id: clinic.id,
        name: clinic.name,
        organizationId: organizationFor(clinic.id),
        timezone: "Africa/Nairobi",
      })
      .onConflictDoUpdate({
        target: clinics.id,
        set: {
          name: clinic.name,
          organizationId: organizationFor(clinic.id),
        },
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
      notificationChannel: "in_app" as const,
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
          notificationChannel: values.notificationChannel,
        },
      });
  }

  // Backfilled rows (from a pre-005 database) that are not in the seed file
  // keep their placeholder names; only ids present above are touched.
  return ORGANIZATIONS.length + context.clinics.length + seededPatients.length;
};
