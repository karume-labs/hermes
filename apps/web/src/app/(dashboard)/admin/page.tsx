import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MetricsView } from "@/features/admin/components/metrics-view";

export const metadata: Metadata = {
  title: "Governance · Hermes Care",
  description: "Acknowledgment, conversion, retention and SLA performance.",
};

const AdminPage = (): ReactNode => <MetricsView />;

export default AdminPage;
