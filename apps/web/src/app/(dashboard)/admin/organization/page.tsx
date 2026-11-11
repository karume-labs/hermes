import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OrganizationView } from "@/features/admin/components/organization-view";

export const metadata: Metadata = {
  title: "Organization",
  description: "Your clinics, care teams and alert preferences.",
};

const OrganizationPage = (): ReactNode => <OrganizationView />;

export default OrganizationPage;
