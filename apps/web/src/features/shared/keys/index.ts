export type QueueFilters = {
  severity: string;
  status: string;
};

export const queryKeys = {
  session: ["session"] as const,
  cases: {
    all: ["cases"] as const,
    list: (filters: QueueFilters) => ["cases", "list", filters] as const,
    detail: (caseId: string) => ["cases", "detail", caseId] as const,
  },
  metrics: ["metrics"] as const,
  notifications: {
    all: ["notifications"] as const,
    stats: ["notifications", "stats"] as const,
  },
  webhooks: ["webhooks", "logs"] as const,
  routingRules: ["routing-rules"] as const,
  slots: (clinicId: string) => ["slots", clinicId] as const,
} as const;
