// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DeliveryView } from "@/features/admin/components/delivery-view";

export const metadata: Metadata = {
  title: "Delivery",
  description: "Push and SMS delivery health for patient notifications.",
};

const DeliveryPage = (): ReactNode => <DeliveryView />;

export default DeliveryPage;
