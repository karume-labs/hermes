import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WebhookLogTable } from "@/features/admin/components/webhook-log-table";

export const metadata: Metadata = {
  title: "Webhook log · Hermes Care",
  description: "Inbound lab webhook audit with signature verification.",
};

const WebhooksPage = (): ReactNode => <WebhookLogTable />;

export default WebhooksPage;
