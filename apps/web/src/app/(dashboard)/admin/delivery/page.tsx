import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DeliveryView } from "@/features/admin/components/delivery-view";

export const metadata: Metadata = {
  title: "Delivery · Hermes Care",
  description: "Push and SMS delivery health for patient notifications.",
};

const DeliveryPage = (): ReactNode => <DeliveryView />;

export default DeliveryPage;
