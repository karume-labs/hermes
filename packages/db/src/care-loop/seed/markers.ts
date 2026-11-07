import type { Severity } from "./types";

export interface Marker {
  name: string;
  unit: string;
  severeValues: string[];
  moderateValues: string[];
  mildValues: string[];
}

/**
 * The markers a Kenyan primary-care lab panel actually returns. Values move
 * with severity so the summary a coordinator reads matches the grade.
 */
export const MARKERS: Marker[] = [
  {
    name: "potassium",
    unit: "mmol/L",
    severeValues: ["6.1", "6.4", "6.8"],
    moderateValues: ["5.5", "5.7"],
    mildValues: ["5.2", "5.3"],
  },
  {
    name: "blood glucose",
    unit: "mg/dL",
    severeValues: ["306", "362", "398"],
    moderateValues: ["214", "236"],
    mildValues: ["142", "156"],
  },
  {
    name: "HbA1c",
    unit: "%",
    severeValues: ["10.4", "11.2"],
    moderateValues: ["8.1", "8.7"],
    mildValues: ["6.9", "7.3"],
  },
  {
    name: "haemoglobin",
    unit: "g/dL",
    severeValues: ["6.2", "6.9"],
    moderateValues: ["9.1", "9.6"],
    mildValues: ["11.2", "11.8"],
  },
  {
    name: "creatinine",
    unit: "mg/dL",
    severeValues: ["3.4", "4.1"],
    moderateValues: ["1.9", "2.2"],
    mildValues: ["1.4", "1.5"],
  },
  {
    name: "troponin",
    unit: "ng/mL",
    severeValues: ["0.72", "0.94"],
    moderateValues: ["0.18", "0.24"],
    mildValues: ["0.09"],
  },
  {
    name: "TSH",
    unit: "mIU/L",
    severeValues: ["12.8", "15.4"],
    moderateValues: ["6.2", "7.9"],
    mildValues: ["4.9", "5.1"],
  },
  {
    name: "platelets",
    unit: "x10^9/L",
    severeValues: ["62", "78"],
    moderateValues: ["112", "126"],
    mildValues: ["148", "162"],
  },
];

export const FOLLOW_UP: Record<Severity, string> = {
  Urgent:
    "needs prompt follow-up — a clinician will call you within four hours",
  Actionable: "needs follow-up — please book a visit in the next two days",
  Routine:
    "is slightly outside the usual range — mention it at your next visit",
};

export const CLOSURE_PLANS = [
  "Repeat panel booked, result explained and acknowledged",
  "Reviewed by clinician, treatment adjusted, follow-up in 2 weeks",
  "Referred to specialist clinic, patient informed by phone",
];

export const COORDINATORS = [
  "coordinator@hermescare.test",
  "duty.coordinator@hermescare.test",
];

export const CLINICIANS = [
  "clinician@hermescare.test",
  "dr.otieno@hermescare.test",
];
