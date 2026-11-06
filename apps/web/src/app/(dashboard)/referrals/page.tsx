// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ReferralsView } from "@/features/clinic/components/referrals-view";

export const metadata: Metadata = {
  title: "Referral inbox",
  description: "Incoming and outgoing hand-offs for the clinic.",
};

const ReferralsPage = (): ReactNode => <ReferralsView />;

export default ReferralsPage;
