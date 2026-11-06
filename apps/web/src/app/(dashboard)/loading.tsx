import { Center, Loader, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

const DashboardLoading = (): ReactNode => (
  <Center mih="50vh">
    <Stack align="center" gap="sm">
      <Loader size="sm" color="brandSlate.9" />
      <Text size="sm" c="dimmed">
        Loading the care queue…
      </Text>
    </Stack>
  </Center>
);

export default DashboardLoading;
