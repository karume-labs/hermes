"use client";

import { type CloseCaseForm, closeCaseForm } from "@hermes/validators";
import { Alert, Button, Group, Stack, Text, Textarea } from "@mantine/core";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/features/auth/services/client";
import { useCloseCase } from "@/features/cases/services/mutations-case";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

interface CloseCaseFormProps {
  caseId: string;
  disabled: boolean;
}

export const CaseCloseForm = ({
  caseId,
  disabled,
}: CloseCaseFormProps): ReactNode => {
  const close = useCloseCase();
  const session = authClient.useSession();
  const role = session.data?.user.role;
  const canClose = role === "clinician" || role === "admin";
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CloseCaseForm>({
    resolver: friendlyTypeboxResolver(closeCaseForm),
    defaultValues: { caseId, evidence: "", plan: "" },
  });

  const onSubmit = (values: CloseCaseForm) => close.mutate(values);
  // Closure requires both clinical evidence and a named follow-up plan.
  const evidenceReady =
    watch("evidence").trim().length > 0 && watch("plan").trim().length > 0;

  if (!canClose) {
    return (
      <Alert color="orange" title="Clinical sign-off required">
        A coordinator can prepare this record, but only a clinician or
        administrator can close the case.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="sm">
        {close.isError ? (
          <Alert color="red">{errorMessage(close.error)}</Alert>
        ) : null}
        <Textarea
          label="Clinical evidence"
          placeholder="Visit summary, confirmatory result, and what was confirmed"
          minRows={2}
          error={errors.evidence?.message}
          disabled={disabled}
          {...register("evidence")}
        />
        <Textarea
          label="Follow-up plan"
          placeholder="Treatment, surveillance interval and who owns the next step"
          minRows={2}
          error={errors.plan?.message}
          disabled={disabled}
          {...register("plan")}
        />
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Signed off as {session.data?.user.email ?? "current user"}.
          </Text>
          <Button
            type="submit"
            loading={close.isPending}
            disabled={disabled || !evidenceReady}
          >
            Close case
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
