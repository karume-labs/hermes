// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueueView } from "@/features/queue/components/queue-view";

export const metadata: Metadata = {
  title: "Queue",
  description: "Results that still need a person, soonest deadline first.",
};

const QueuePage = (): ReactNode => <QueueView />;

export default QueuePage;
