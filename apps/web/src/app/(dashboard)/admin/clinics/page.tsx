// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClinicsView } from "@/features/admin/components/clinics-view";

export const metadata: Metadata = {
  title: "Clinics & tenancy",
  description: "Network clinics, staffing and open care load.",
};

const ClinicsPage = (): ReactNode => <ClinicsView />;

export default ClinicsPage;
