"use client";

import type { CaseDetail } from "@hermes/types";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Divider,
  FileInput,
  Group,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { IconFileText, IconUpload } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useUploadAttachment } from "@/features/cases/services/mutations";
import { env } from "@/features/shared/env/index";

const CARD_STYLE = "1px solid var(--mantine-color-brandChalk-3)";

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
  const upload = useUploadAttachment(detail.id);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<string>("lab_report");

  return (
    <Stack gap="md">
      <Card radius="sm" p="lg" bg="brandChalk.0" bd={CARD_STYLE}>
        <Stack gap="sm">
          <Group gap="xs">
            <IconFileText size={18} />
            <Text fw={700} size="sm">
              Upload a document
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Lab reports, referral letters and closure evidence are stored on the
            API server. PDF, PNG, JPEG, WebP or plain text, up to 10 MB.
          </Text>
          <Group align="flex-end" gap="sm" wrap="wrap">
            <FileInput
              label="File"
              placeholder="Choose a file"
              value={file}
              onChange={setFile}
              accept="application/pdf,image/png,image/jpeg,image/webp,text/plain"
              leftSection={<IconUpload size={16} />}
              w={{ base: "100%", sm: 320 }}
            />
            <Select
              label="Type"
              data={KIND_OPTIONS}
              value={kind}
              onChange={(value) => setKind(value ?? "other")}
              w={{ base: "100%", sm: 200 }}
              allowDeselect={false}
            />
            <Button
              leftSection={<IconUpload size={16} />}
              loading={upload.isPending}
              disabled={file === null}
              onClick={() => {
                if (file === null) return;
                upload.mutate(
                  { file, kind },
                  {
                    onSuccess: () => {
                      setFile(null);
                    },
                  },
                );
              }}
            >
              Upload
            </Button>
          </Group>
          {upload.isError ? (
            <Alert color="red" title="Upload failed">
              {upload.error.message}
            </Alert>
          ) : null}
        </Stack>
      </Card>

      <Card radius="sm" p="lg" bg="brandChalk.0" bd={CARD_STYLE}>
        <Group justify="space-between" mb="sm">
          <Text size="xs" c="brandSlate.5" tt="uppercase" fw={700} lts="0.1em">
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
