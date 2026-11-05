import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueueView } from "@/features/queue/components/queue-view";

export const metadata: Metadata = {
  title: "Queue · Hermes Care",
  description:
    "Active screening queue filtered by SLA urgency and risk severity.",
};

const QueuePage = (): ReactNode => <QueueView />;

export default QueuePage;
