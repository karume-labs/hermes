import { Anchor, Card, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

const NotFoundPage = (): ReactNode => (
  <Card maw={520} mx="auto" mt="xl" p="xl" radius="sm">
    <Stack gap="md">
      <Title order={2} fw={900} c="brandSlate.9">
        Page not found
      </Title>
      <Text size="sm" c="dimmed">
        That page no longer exists, or you do not have access to it.
      </Text>
      <Anchor href="/queue" fw={600}>
        Back to the queue
      </Anchor>
    </Stack>
  </Card>
);

export default NotFoundPage;
