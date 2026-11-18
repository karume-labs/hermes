"use client";

import { type SignInBody, signInBody } from "@hermes/validators";
import {
  Alert,
  Button,
  Card,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useSignIn } from "@/features/auth/services/mutations";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

export const SignInForm = (): ReactNode => {
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInBody>({
    resolver: friendlyTypeboxResolver(signInBody),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: SignInBody) => signIn.mutate(values);

  return (
    <Card w={420} maw="100%" p="xl" radius="lg">
      <Stack gap="md">
        <Stack gap={6}>
          <span
            aria-hidden
            style={{
              width: 22,
              height: 3,
              borderRadius: 2,
              backgroundColor: "var(--hermes-accent)",
            }}
          />
          <Title order={2} fw={800} c="var(--hermes-ink)" lts="-0.02em">
            Sign in
          </Title>
          <Text size="sm" c="dimmed">
            Clinical staff only. Patient results are unlocked in the mobile app.
          </Text>
        </Stack>

        <form method="post" onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            {signIn.isError ? (
              <Alert color="red" title="Sign-in failed">
                {errorMessage(signIn.error)}
              </Alert>
            ) : null}

            <TextInput
              label="Work email"
              placeholder="you@clinic.test"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              leftSection={<IconLock size={16} />}
              loading={isSubmitting || signIn.isPending}
              fullWidth
            >
              Sign in
            </Button>
          </Stack>
        </form>

        <Text size="xs" c="dimmed" ta="center">
          Accounts are created by an administrator. If you were invited, use the
          link in your invite email to set a password.
        </Text>
      </Stack>
    </Card>
  );
};
