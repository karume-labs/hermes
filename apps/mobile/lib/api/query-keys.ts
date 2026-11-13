export const queryKeys = {
  profile: ["patient", "profile"] as const,
  cases: ["patient", "cases"] as const,
  caseDetail: (caseId: string) => ["patient", "case", caseId] as const,
  messages: (caseId: string) => ["patient", "messages", caseId] as const,
  bookings: ["patient", "bookings"] as const,
  notifications: ["patient", "notifications"] as const,
  slots: (clinicId: string, kind: string) =>
    ["patient", "slots", clinicId, kind] as const,
} as const;
