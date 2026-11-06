// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppointmentsView } from "@/features/clinic/components/appointments-view";

export const metadata: Metadata = {
  title: "Clinic schedule",
  description: "Booked, attended and cancelled visits across the clinic.",
};

const AppointmentsPage = (): ReactNode => <AppointmentsView />;

export default AppointmentsPage;
