"use client";

import type { CaseDetail } from "@hermes/types";
import {
  Anchor,
  Badge,
  Card,
  Divider,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AttachmentUploadCard } from "@/features/cases/components/attachment-upload-card";
import { useUploadAttachment } from "@/features/cases/services/mutations-attachment";
import { env } from "@/features/shared/env/index";

const CARD_STYLE = "1px solid var(--hermes-line)";

const KIND_OPTIONS = [
  { value: "lab_report", label: "Lab report" },
  { value: "referral_letter", label: "Referral letter" },
  { value: "closure_evidence", label: "Closure evidence" },
  { value: "other", label: "Other" },
];

const KIND_LABELS: Record<string, string> = Object.fromEntries(
  KIND_OPTIONS.map((option) => [option.value, option.label]),
);

const formatSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

interface CaseAttachmentsProps {
  detail: CaseDetail;
}

export const CaseAttachments = ({
  detail,
}: CaseAttachmentsProps): ReactNode => {
  const _upload = useUploadAttachment(detail.id);
  const [_file, _setFile] = useState<File | null>(null);
  const [_kind, _setKind] = useState<string>("lab_report");

  return (
    <Stack gap="md">
      <AttachmentUploadCard caseId={detail.id} />

      <Card radius="sm" p="lg" bg="var(--hermes-surface)" bd={CARD_STYLE}>
        <Group justify="space-between" mb="sm">
          <Text
            size="xs"
            c="var(--hermes-ink-muted)"
            tt="uppercase"
            fw={700}
            lts="0.1em"
          >
            Documents
          </Text>
          <Badge variant="light">{detail.attachments.length}</Badge>
        </Group>

        {detail.attachments.length === 0 ? (
          <Text size="sm" c="dimmed">
            No documents on this case yet.
          </Text>
        ) : (
          <Stack gap={0}>
            {detail.attachments.map((attachment, index) => (
              <Stack key={attachment.id} gap={0}>
                {index > 0 ? <Divider my="sm" /> : null}
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap">
                    <IconFileText size={18} />
                    <Stack gap={2}>
                      <Anchor
                        href={`${env.NEXT_PUBLIC_API_URL}/attachments/${attachment.id}`}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        fw={600}
                      >
                        {attachment.filename}
                      </Anchor>
                      <Text size="xs" c="dimmed">
                        {formatSize(attachment.sizeBytes)} ·{" "}
                        {attachment.uploadedBy} ·{" "}
                        {new Date(attachment.createdAt).toLocaleString()}
                      </Text>
                    </Stack>
                  </Group>
                  <Badge variant="outline">
                    {KIND_LABELS[attachment.kind] ?? "Other"}
                  </Badge>
                </Group>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
};
