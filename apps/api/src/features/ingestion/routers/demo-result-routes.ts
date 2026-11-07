import { ingestLab } from "@api/features/ingestion/services/ingest-service";
import { requireStaff } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import { asc, eq } from "drizzle-orm";
import { Elysia } from "elysia";

const MARKERS = [
  { code: "ldl", value: 195, unit: "mg/dL" },
  { code: "hba1c", value: 8.4, unit: "%" },
  { code: "potassium", value: 5.9, unit: "mmol/L" },
  { code: "egfr", value: 52, unit: "mL/min" },
];

/**
 * "Send a test result" in the dashboard. The HMAC lab feed stays for real
 * integrations; this staff-authenticated route lets the care team watch triage,
 * routing and notification happen for a patient they already serve.
 */
export const demoResultRoutes = new Elysia().post(
  "/cases/demo-result",
  async ({ headers }) => {
    const staff = await requireStaff(headers);
    const [patient] = await db
      .select({ id: patients.id, clinicId: patients.clinicId })
      .from(patients)
      .where(
        staff.clinicId === null
          ? undefined
          : eq(patients.clinicId, staff.clinicId),
      )
      .orderBy(asc(patients.id))
      .limit(1);
    if (patient === undefined) {
      throw new NotFoundError(
        "No patient at this clinic to attach a result to",
      );
    }

    const marker = MARKERS[Math.floor(Math.random() * MARKERS.length)];
    const result = await ingestLab({
      patientId: patient.id,
      clinicId: patient.clinicId,
      markerCode: marker.code,
      markerValue: marker.value,
      unit: marker.unit,
      takenAt: new Date().toISOString(),
      facilityId: "demo-lab",
      sourceMessageId: `demo_${crypto.randomUUID()}`,
    });
    return result;
  },
);
