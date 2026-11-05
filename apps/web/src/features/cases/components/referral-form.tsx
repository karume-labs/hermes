"use client";

import { type ReferralForm, referralForm } from "@hermes/validators";
import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useLinkReferral } from "@/features/cases/services/mutations";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

const CLINICS = [
  { value: "specialty-1", label: "Specialty clinic 1" },
  { value: "specialty-2", label: "Specialty clinic 2" },
  { value: "clinic-1", label: "Primary care · clinic 1" },
];

interface ReferralFormProps {
  caseId: string;
  currentClinicId: string | null;
  disabled: boolean;
}

export const CaseReferralForm = ({
  caseId,
  currentClinicId,
  disabled,
}: ReferralFormProps): ReactNode => {
  const refer = useLinkReferral();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReferralForm>({
    resolver: friendlyTypeboxResolver(referralForm),
    defaultValues: { toClinicId: "specialty-1", note: "" },
  });

  const onSubmit = (values: ReferralForm) => {
    refer.mutate(
      { caseId, toClinicId: values.toClinicId, note: values.note },
      { onSuccess: () => reset({ toClinicId: values.toClinicId, note: "" }) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="sm">
        {currentClinicId === null ? null : (
          <Text size="sm" c="dimmed">
            Currently referred to {currentClinicId}
          </Text>
        )}
        {refer.isError ? (
          <Alert color="red">{errorMessage(refer.error)}</Alert>
        ) : null}
        <Select
          label="Receiving clinic"
          data={CLINICS}
          value={watch("toClinicId")}
          onChange={(value) => {
            if (value !== null) setValue("toClinicId", value);
          }}
          error={errors.toClinicId?.message}
          disabled={disabled}
        />
        <TextInput
          label="Hand-off note"
          placeholder="Routine specialist review requested"
          error={errors.note?.message}
          disabled={disabled}
          {...register("note")}
        />
        <Group justify="flex-end">
          <Button
            type="submit"
            variant="light"
            loading={refer.isPending}
            disabled={disabled}
          >
            Link referral
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
