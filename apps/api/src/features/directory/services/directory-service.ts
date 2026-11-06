import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import type { Clinic, Patient } from "@hermes/types";
import { asc, eq } from "drizzle-orm";

export const listClinics = async (): Promise<Clinic[]> => {
  const rows = await db.select().from(clinics).orderBy(asc(clinics.name));
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
};

export const findClinic = async (id: string): Promise<Clinic | null> => {
  const [row] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);
  if (row === undefined) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

export const findPatient = async (id: string): Promise<Patient | null> => {
  const [row] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);
  if (row === undefined) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

export const findPatientByPhone = async (
  phone: string,
): Promise<Patient | null> => {
  const [row] = await db
    .select()
    .from(patients)
    .where(eq(patients.phone, phone))
    .limit(1);
  if (row === undefined) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};
