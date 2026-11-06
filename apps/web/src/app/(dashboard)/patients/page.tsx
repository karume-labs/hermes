// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PatientsView } from "@/features/clinic/components/patients-view";

export const metadata: Metadata = {
  title: "Patient roster",
  description: "Registered patients, contact details and open care load.",
};

const PatientsPage = (): ReactNode => <PatientsView />;

export default PatientsPage;
