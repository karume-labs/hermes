// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RoutingView } from "@/features/admin/components/routing-view";

export const metadata: Metadata = {
  title: "Routing",
  description: "Marker-prefix routing rules for incoming lab results.",
};

const RoutingPage = (): ReactNode => <RoutingView />;

export default RoutingPage;
