"use client";

import { Button, Card, Code, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorPageProps): ReactNode => (
  <Card maw={560} mx="auto" mt="xl" p="xl" radius="sm">
    <Stack gap="md">
      <Title order={2} fw={900} c="var(--hermes-ink)">
        Something went wrong
      </Title>
      <Text size="sm" c="dimmed">
        The dashboard could not finish that request. Retry, and if it keeps
        failing tell your administrator with the reference below.
      </Text>
      {error.digest === undefined ? null : (
        <Code>Reference {error.digest}</Code>
      )}
      <Button onClick={reset}>Try again</Button>
    </Stack>
  </Card>
);

export default ErrorPage;
