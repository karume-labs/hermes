"use client";

import { type CloseCaseForm, closeCaseForm } from "@hermes/validators";
import { Alert, Button, Group, Select, Stack, Textarea } from "@mantine/core";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useCloseCase } from "@/features/cases/services/mutations";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

const CLINICIANS = [
  { value: "dr-1", label: "Dr. Ada Okafor" },
  { value: "dr-2", label: "Dr. Miles Chen" },
  { value: "coordinator-1", label: "Coordinator (outreach sign-off)" },
];

interface CloseCaseFormProps {
  caseId: string;
  disabled: boolean;
}

export const CaseCloseForm = ({
  caseId,
  disabled,
}: CloseCaseFormProps): ReactNode => {
  const close = useCloseCase();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CloseCaseForm>({
    resolver: friendlyTypeboxResolver(closeCaseForm),
    defaultValues: { caseId, clinicianId: "dr-1", evidence: "", plan: "" },
  });

  const onSubmit = (values: CloseCaseForm) => close.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="sm">
        {close.isError ? (
          <Alert color="red">{errorMessage(close.error)}</Alert>
        ) : null}
        <Select
          label="Clinician"
          data={CLINICIANS}
          value={watch("clinicianId")}
          onChange={(value) => {
            if (value !== null) setValue("clinicianId", value);
          }}
          error={errors.clinicianId?.message}
          disabled={disabled}
        />
        <Textarea
          label="Clinical evidence"
          placeholder="Visit summary, repeat labs, and what was confirmed"
          minRows={2}
          error={errors.evidence?.message}
          disabled={disabled}
          {...register("evidence")}
        />
        <Textarea
          label="Follow-up plan"
          placeholder="Surveillance interval and who owns the next step"
          minRows={2}
          error={errors.plan?.message}
          disabled={disabled}
          {...register("plan")}
        />
        <Group justify="flex-end">
          <Button
            type="submit"
            color="teal"
            loading={close.isPending}
            disabled={disabled}
          >
            Close case
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
