export type QueueFilters = {
  severity: string;
  status: string;
  assigned: string;
  unassigned: string;
  overdue: string;
};

export const queryKeys = {
  session: ["session"] as const,
  cases: {
    all: ["cases"] as const,
    list: (filters: QueueFilters) => ["cases", "list", filters] as const,
    detail: (caseId: string) => ["cases", "detail", caseId] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (status: string) => ["tasks", "list", status] as const,
  },
  metrics: ["metrics"] as const,
  notifications: {
    all: ["notifications"] as const,
    stats: ["notifications", "stats"] as const,
  },
  webhooks: ["webhooks", "logs"] as const,
  routingRules: ["routing-rules"] as const,
  clinics: ["clinics"] as const,
  staff: {
    preferences: ["staff", "preferences"] as const,
    users: ["staff", "users"] as const,
    invites: ["staff", "invites"] as const,
    team: ["staff", "team"] as const,
  },
  slots: (clinicId: string) => ["slots", clinicId] as const,
  clinic: {
    appointments: ["clinic", "appointments"] as const,
    patients: ["clinic", "patients"] as const,
    referrals: ["clinic", "referrals"] as const,
  },
  admin: {
    clinics: ["admin", "clinics"] as const,
    audit: ["admin", "audit"] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    mine: ["organizations", "mine"] as const,
    clinics: ["organizations", "clinics"] as const,
  },
} as const;
