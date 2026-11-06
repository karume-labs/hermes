"use client";

import {
  Alert,
  Button,
  Card,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { api } from "@/features/shared/api/index";

interface AcceptInviteFormProps {
  token: string;
}

export const AcceptInviteForm = ({
  token,
}: AcceptInviteFormProps): ReactNode => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (): Promise<void> => {
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    const { error: failure } = await api.staff.invites.accept.post({
      token,
      password,
    });
    setPending(false);
    if (failure !== null) {
      setError(
        failure.value === null || typeof failure.value !== "object"
          ? "This invite could not be used."
          : "message" in failure.value &&
              typeof failure.value.message === "string"
            ? failure.value.message
            : "This invite could not be used.",
      );
      return;
    }
    router.replace("/sign-in?invited=1");
  };

  return (
    <Card w={440} maw="100%" p="xl" radius="sm">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2} fw={900} c="brandSlate.9">
            Set your password
          </Title>
          <Text size="sm" c="dimmed">
            Your clinic administrator invited this address. Choose a password to
            activate your Hermes account.
          </Text>
        </Stack>

        {error === null ? null : (
          <Alert color="red" title="Invite not accepted">
            {error}
          </Alert>
        )}

        <PasswordInput
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.currentTarget.value)}
        />
        <Button
          leftSection={<IconShieldCheck size={16} />}
          loading={pending}
          onClick={() => void submit()}
          fullWidth
        >
          Activate account
        </Button>
      </Stack>
    </Card>
  );
};
