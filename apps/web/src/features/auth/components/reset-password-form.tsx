"use client";

import { Alert, Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { authClient } from "@/features/auth/services/client";

export const ResetPasswordForm = ({ token }: { token: string }): ReactNode => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError("");
    const response = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setBusy(false);
    if (response.error !== null) {
      setError(
        response.error.message ??
          "That reset link is invalid or has expired. Ask an administrator for a new one.",
      );
      return;
    }
    setDone(true);
  };

  if (token === "") {
    return (
      <Alert color="red" title="This link is incomplete">
        Open the link from your password reset email, or ask your administrator
        to send a new one.
      </Alert>
    );
  }

  if (done) {
    return (
      <Stack gap="md">
        <Title order={2}>Password updated</Title>
        <Text size="sm">You can now sign in with your new password.</Text>
        <Button onClick={() => router.replace("/sign-in")}>
          Go to sign in
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Title order={2}>Choose a new password</Title>
      <Text size="sm" c="dimmed">
        Use at least eight characters. The link works once.
      </Text>
      {error === "" ? null : (
        <Alert color="red" title="Password not changed">
          {error}
        </Alert>
      )}
      <TextInput
        label="New password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
      />
      <Button
        loading={busy}
        disabled={password.length < 8}
        onClick={() => {
          void submit();
        }}
      >
        Save password
      </Button>
    </Stack>
  );
};
