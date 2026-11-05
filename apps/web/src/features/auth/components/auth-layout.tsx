import { Box, Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import {
  HermesMark,
  HermesWordmark,
} from "@/features/shared/components/brand/hermes-mark";

const POINTS = [
  "Every screening result triaged by clinical severity.",
  "Patients acknowledge from the mobile app, not a phone tree.",
  "SLA clocks, referrals and closures audited end to end.",
];

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps): ReactNode => (
  <Box
    mih="100vh"
    bg="brandChalk.1"
    style={{ display: "grid", gridTemplateColumns: "1fr" }}
  >
    <Group align="stretch" gap={0} wrap="nowrap" mih="100vh">
      <Box
        visibleFrom="md"
        w="46%"
        bg="brandSlate.9"
        p={56}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Group gap="sm">
          <HermesMark variant="patient" size={44} title="Hermes Care" />
          <HermesWordmark size={22} color="#F8FAFC" />
        </Group>

        <Stack gap="lg" maw={420}>
          <Title
            order={1}
            c="brandChalk.0"
            lts="0.02em"
            style={{ lineHeight: 1.15 }}
          >
            Screening to sign-off, without the phone calls.
          </Title>
          <Text c="brandChalk.4" size="sm" lh={1.7}>
            Hermes closes the loop between the lab, the clinic and the patient.
          </Text>
          <Stack gap="sm">
            {POINTS.map((point) => (
              <Group key={point} gap="sm" wrap="nowrap" align="flex-start">
                <Box
                  mt={6}
                  w={6}
                  h={6}
                  bg="brandSky.6"
                  style={{ borderRadius: 999, flexShrink: 0 }}
                />
                <Text size="sm" c="brandChalk.3">
                  {point}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>

        <Text size="xs" c="brandChalk.5" lts="0.12em" tt="uppercase">
          Hermes care loop · 2026
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
