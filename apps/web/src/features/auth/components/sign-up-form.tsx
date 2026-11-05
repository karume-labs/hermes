"use client";

import { type SignUpBody, signUpBody } from "@hermes/validators";
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
import { IconUserPlus } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { GoogleButton } from "@/features/auth/components/google-button";
import { useSignUp } from "@/features/auth/services/mutations";
import { env } from "@/features/shared/env/index";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

export const SignUpForm = (): ReactNode => {
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpBody>({
    resolver: friendlyTypeboxResolver(signUpBody),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (values: SignUpBody) => signUp.mutate(values);

  return (
    <Card withBorder shadow="md" p="xl" w={460} maw="100%">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2}>Create your account</Title>
          <Text size="sm" c="dimmed">
            New staff start as coordinators. An administrator can promote you to
            governance access.
          </Text>
        </Stack>

        {env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ? (
          <>
            <GoogleButton />
            <Divider label="or sign up with email" labelPosition="center" />
          </>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            {signUp.isError ? (
              <Alert color="red" title="Sign-up failed">
                {errorMessage(signUp.error)}
              </Alert>
            ) : null}

            <TextInput
              label="Full name"
              placeholder="Casey Coordinator"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <TextInput
              label="Work email"
              placeholder="you@clinic.test"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              leftSection={<IconUserPlus size={16} />}
              loading={isSubmitting || signUp.isPending}
              fullWidth
            >
              Create account
            </Button>
          </Stack>
        </form>

        <Text size="sm" ta="center">
          Already have an account?{" "}
          <Anchor component={Link} href="/sign-in" fw={600}>
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </Card>
  );
};
