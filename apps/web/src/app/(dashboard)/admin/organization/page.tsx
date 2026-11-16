// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OrganizationView } from "@/features/admin/components/organization-view";

export const metadata: Metadata = {
  title: "Organization",
  description: "Your clinics, care teams and alert preferences.",
};

const OrganizationPage = (): ReactNode => <OrganizationView />;

export default OrganizationPage;
