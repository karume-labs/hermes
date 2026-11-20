// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WebhookView } from "@/features/admin/components/webhook-view";

export const metadata: Metadata = {
  title: "Webhook log",
  description: "Inbound lab webhook audit with signature verification.",
};

const WebhooksPage = (): ReactNode => <WebhookView />;

export default WebhooksPage;
