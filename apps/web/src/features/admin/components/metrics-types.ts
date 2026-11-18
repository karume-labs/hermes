import type { useCareMetrics } from "@/features/admin/services/queries";

/** The governance payload, taken from the query so it cannot drift. */
export type Metrics = NonNullable<ReturnType<typeof useCareMetrics>["data"]>;
