import { Box, Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import {
  HermesMark,
  HermesWordmark,
} from "@/features/shared/components/brand/hermes-mark";

const POINTS = [
  "Every screening result triaged by clinical severity.",
  "Patients confirm results in the mobile app, not over the phone.",
  "Every deadline, referral and closure is recorded.",
];

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps): ReactNode => (
  <Box
    mih="100vh"
    bg="var(--hermes-canvas)"
    style={{ display: "grid", gridTemplateColumns: "1fr" }}
  >
    <Group align="stretch" gap={0} wrap="nowrap" mih="100vh">
      <Box
        visibleFrom="md"
        w="46%"
        bg="var(--hermes-surface-tint)"
        bd="1px solid var(--hermes-line)"
        p={56}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Group gap="sm">
          <HermesMark variant="clinic" size={44} title="Hermes Care" />
          <HermesWordmark size={22} />
        </Group>

        <Stack gap="lg" maw={420}>
          <Title
            order={1}
            c="var(--hermes-ink)"
            lts="0.02em"
            style={{ lineHeight: 1.15 }}
          >
            Screening to sign-off, without the phone calls.
          </Title>
          <Text c="var(--hermes-ink-soft)" size="sm" lh={1.7}>
            Hermes keeps the lab, the clinic and the patient on the same page.
          </Text>
          <Stack gap="sm">
            {POINTS.map((point) => (
              <Group key={point} gap="sm" wrap="nowrap" align="flex-start">
                <Box
                  mt={6}
                  w={6}
                  h={6}
                  bg="var(--hermes-spark)"
                  style={{ borderRadius: 999, flexShrink: 0 }}
                />
                <Text size="sm" c="var(--hermes-ink-soft)">
                  {point}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>

        <Text size="xs" c="var(--hermes-ink-muted)" lts="0.12em" tt="uppercase">
          Hermes care · 2026
        </Text>
      </Box>

      <Box
        flex={1}
        p={{ base: "md", sm: "xl" }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </Box>
    </Group>
  </Box>
);
