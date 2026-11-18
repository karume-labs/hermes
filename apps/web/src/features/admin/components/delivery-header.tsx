"use client";

import { Button } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/features/shared/components/layout/page-header";

interface DeliveryHeaderProps {
  isPending: boolean;
  onRun: () => void;
}

export const DeliveryHeader = ({
  isPending,
  onRun,
}: DeliveryHeaderProps): ReactNode => (
  <PageHeader
    eyebrow="Administration"
    title="Delivery & integrations"
    subtitle="Push, SMS fallback, webhook intake and lab-feed health."
    icon={<IconSend size={24} />}
    tone="info"
    actions={
      <Button
        leftSection={<IconSend size={16} />}
        loading={isPending}
        onClick={onRun}
      >
        Run outbox now
      </Button>
    }
  />
);
