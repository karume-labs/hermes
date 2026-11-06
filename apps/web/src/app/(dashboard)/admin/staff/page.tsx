// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StaffView } from "@/features/admin/components/staff-view";

export const metadata: Metadata = {
  title: "Staff access",
  description: "Invite staff, assign clinics and revoke dashboard access.",
};

const StaffPage = (): ReactNode => <StaffView />;

export default StaffPage;
