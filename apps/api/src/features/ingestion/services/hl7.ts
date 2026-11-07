import type { NormalizedLab } from "@api/features/ingestion/types/index";
import { UnprocessableError } from "@api/features/shared/errors/index";

// Minimal HL7v2 ORU^R01 reader: MSH for provenance, PID for the patient and
// one OBX per numeric result. Enough for lab feeds without a full HL7 toolkit.
const field = (parts: string[], index: number): string => parts[index] ?? "";

export const parseHl7DateTime = (value: string, fallback: Date): string => {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(value);
  if (match === null) return fallback.toISOString();
  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
  ).toISOString();
};

export const parseHl7Oru = (raw: string): NormalizedLab[] => {
  const segments = raw
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const msh = segments.find((line) => line.startsWith("MSH|"));
  const pid = segments.find((line) => line.startsWith("PID|"));
  if (msh === undefined) throw new UnprocessableError("HL7 message needs MSH");
  if (pid === undefined) throw new UnprocessableError("HL7 message needs PID");

  const mshParts = msh.split("|");
  const pidParts = pid.split("|");
  const patientId = field(pidParts, 3).split("^")[0];
  if (patientId === "")
    throw new UnprocessableError("PID-3 patient id missing");

  const messageId = field(mshParts, 9) || crypto.randomUUID();
  const facilityId = field(mshParts, 3) || field(mshParts, 4) || "lab-unknown";
  const fallbackTakenAt = new Date();

  const labs = segments
    .filter((line) => line.startsWith("OBX|"))
    .flatMap((line, index) => {
      const parts = line.split("|");
      const markerCode = field(parts, 3).split("^")[0];
      const value = Number.parseFloat(field(parts, 5));
      if (markerCode === "" || Number.isNaN(value)) return [];
      return [
        {
          patientId,
          markerCode,
          markerValue: value,
          unit: field(parts, 6).split("^")[0],
          takenAt: parseHl7DateTime(field(parts, 14), fallbackTakenAt),
          facilityId,
          sourceMessageId: `hl7_${messageId}_${index}`,
          clinicId: null,
        },
      ];
    });

  if (labs.length === 0)
    throw new UnprocessableError("HL7 message has no numeric OBX results");
  return labs;
};
