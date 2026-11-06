import { Card, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { AcceptInviteForm } from "@/features/staff/components/accept-invite-form";

export const metadata: Metadata = {
  title: "Accept invite",
  description: "Activate your Hermes Care staff account.",
  robots: { index: false, follow: false },
};

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

const AcceptInvitePage = async ({
  searchParams,
}: AcceptInvitePageProps): Promise<ReactNode> => {
  const { token } = await searchParams;
  return (
    <AuthLayout>
      {token === undefined || token.length === 0 ? (
        <Card w={440} maw="100%" p="xl" radius="sm">
          <Title order={2} fw={900} c="brandSlate.9">
            Invite link incomplete
          </Title>
          <Text size="sm" c="dimmed" mt="sm">
            Ask your administrator for a fresh invite. Links expire after seven
            days and work once.
          </Text>
        </Card>
      ) : (
        <AcceptInviteForm token={token} />
      )}
    </AuthLayout>
  );
};

export default AcceptInvitePage;
