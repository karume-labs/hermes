"use client";

import { type SignInBody, signInBody } from "@hermes/validators";
import {
  Alert,
  Anchor,
  Button,
  Card,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { GoogleButton } from "@/features/auth/components/google-button";
import { useSignIn } from "@/features/auth/services/mutations";
import { env } from "@/features/shared/env/index";
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
    <Card w={420} maw="100%" p="xl" radius="sm">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2} fw={900} c="brandSlate.9">
            Sign in
          </Title>
          <Text size="sm" c="dimmed">
            Clinical staff only. Patient results are unlocked in the mobile app.
          </Text>
        </Stack>

        {env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ? (
          <>
            <GoogleButton />
            <Divider label="or use your clinic email" labelPosition="center" />
          </>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
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

        <Text size="sm" ta="center">
          New coordinator?{" "}
          <Anchor component={Link} href="/sign-up" fw={600}>
            Create an account
          </Anchor>
        </Text>

        <Text size="xs" c="dimmed">
          Test accounts: coordinator@hermescare.test or admin@hermescare.test ·
          password hermes-care
        </Text>
      </Stack>
    </Card>
  );
};
