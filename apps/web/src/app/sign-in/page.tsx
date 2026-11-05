import { Center, Stack, Text, Title } from "@mantine/core";
import { IconActivityHeartbeat } from "@tabler/icons-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · Hermes Care",
  description: "Staff sign-in for the Hermes Care loop-closure dashboard.",
};

const SignInPage = (): ReactNode => (
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
      <SignInForm />
    </Stack>
  </Center>
);

export default SignInPage;
