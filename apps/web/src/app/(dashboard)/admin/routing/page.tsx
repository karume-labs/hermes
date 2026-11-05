import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RoutingView } from "@/features/admin/components/routing-view";

export const metadata: Metadata = {
  title: "Routing · Hermes Care",
  description: "Marker-prefix routing rules for incoming lab results.",
};

const RoutingPage = (): ReactNode => <RoutingView />;

export default RoutingPage;
