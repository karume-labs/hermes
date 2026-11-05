// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MetricsView } from "@/features/admin/components/metrics-view";

export const metadata: Metadata = {
  title: "Governance",
  description: "Acknowledgment, conversion, retention and SLA performance.",
};

const AdminPage = (): ReactNode => <MetricsView />;

export default AdminPage;
