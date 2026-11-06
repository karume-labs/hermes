// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuditView } from "@/features/admin/components/audit-view";

export const metadata: Metadata = {
  title: "Audit trail",
  description: "Global clinical and access events across every clinic.",
};

const AuditPage = (): ReactNode => <AuditView />;

export default AuditPage;
