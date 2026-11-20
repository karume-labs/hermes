"use client";

import { Stack } from "@mantine/core";
import { IconWebhook } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { WebhookLogTable } from "@/features/admin/components/webhook-log-table";
import { PageHeader } from "@/features/shared/components/layout/page-header";

export const WebhookView = (): ReactNode => (
  <Stack gap="xl">
    <PageHeader
      eyebrow="Administration"
      title="Integrations"
      subtitle="Lab feed intake, signature checks and every rejection the edge recorded."
      icon={<IconWebhook size={24} />}
      tone="info"
    />
    <WebhookLogTable />
  </Stack>
);
