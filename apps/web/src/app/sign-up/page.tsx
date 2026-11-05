import { Center, Stack, Text, Title } from "@mantine/core";
import { IconActivityHeartbeat } from "@tabler/icons-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account · Hermes Care",
  description:
    "Create a Hermes Care staff account for the care loop dashboard.",
};

const SignUpPage = (): ReactNode => (
  <Center mih="100vh" bg="gray.0" p="md">
    <Stack align="center" gap="lg">
      <Stack align="center" gap={4}>
        <IconActivityHeartbeat size={32} color="var(--mantine-color-teal-7)" />
        <Title order={1} size="h2">
          Hermes Care
        </Title>
        <Text size="sm" c="dimmed">
          Screening to sign-off
        </Text>
      </Stack>
      <SignUpForm />
    </Stack>
  </Center>
);

export default SignUpPage;
