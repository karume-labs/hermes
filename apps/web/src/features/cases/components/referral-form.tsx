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
import { useLinkReferral } from "@/features/cases/services/mutations-referral";
import { useReferralClinics } from "@/features/cases/services/queries";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

interface ReferralFormProps {
  caseId: string;
  currentClinicId: string | null;
  originClinicId: string;
  disabled: boolean;
}

export const CaseReferralForm = ({
  caseId,
  currentClinicId,
  originClinicId,
  disabled,
}: ReferralFormProps): ReactNode => {
  const refer = useLinkReferral();
  const clinics = useReferralClinics();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReferralForm>({
    resolver: friendlyTypeboxResolver(referralForm),
    defaultValues: { toClinicId: "", note: "" },
  });

  const clinicRows = clinics.data ?? [];
  const options = clinicRows
    .filter((clinic) => clinic.isActive && clinic.id !== originClinicId)
    .map((clinic) => ({ value: clinic.id, label: clinic.name }));
  const currentClinicName =
    currentClinicId === null
      ? null
      : (clinicRows.find((clinic) => clinic.id === currentClinicId)?.name ??
        currentClinicId);

  const onSubmit = (values: ReferralForm) => {
    refer.mutate(
      { caseId, toClinicId: values.toClinicId, note: values.note },
      { onSuccess: () => reset({ toClinicId: values.toClinicId, note: "" }) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="sm">
        {currentClinicName === null ? null : (
          <Text size="sm" c="dimmed">
            Currently referred to {currentClinicName}
          </Text>
        )}
        {refer.isError ? (
          <Alert color="red">{errorMessage(refer.error)}</Alert>
        ) : null}
        <Select
          label="Receiving clinic"
          placeholder="Choose a clinic"
          data={options}
          value={watch("toClinicId") === "" ? null : watch("toClinicId")}
          onChange={(value) => setValue("toClinicId", value ?? "")}
          error={errors.toClinicId?.message}
          disabled={disabled}
          searchable
        />
        <TextInput
          label="Hand-off note"
          placeholder="Reason for referral and what the receiving team should do"
          error={errors.note?.message}
          disabled={disabled}
          {...register("note")}
        />
        <Group justify="flex-end">
          <Button
            type="submit"
            variant="light"
            loading={refer.isPending}
            disabled={disabled || options.length === 0}
          >
            Send referral
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
