"use client";

import {
  Alert,
  Button,
  Code,
  CopyButton,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import type { ReactNode } from "react";

interface StaffInviteResultProps {
  result: { email: string; emailSent: boolean; inviteUrl: string };
}

export const StaffInviteResult = ({
  result,
}: StaffInviteResultProps): ReactNode => (
  <Alert
    color={result.emailSent ? "green" : "yellow"}
    title={result.emailSent ? "Invite emailed" : "Invite ready, email not sent"}
  >
    <Stack gap={6}>
      <Text size="sm">
        {result.emailSent
          ? `We emailed the invite to ${result.email}. The link is also shown here once.`
          : `Email delivery failed for ${result.email}. Share this link directly.`}
      </Text>
      <Group gap="xs" wrap="nowrap">
        <Code style={{ overflowWrap: "anywhere" }}>{result.inviteUrl}</Code>
        <CopyButton value={result.inviteUrl}>
          {({ copied, copy }) => (
            <Button size="compact-xs" variant="light" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </CopyButton>
      </Group>
    </Stack>
  </Alert>
);
