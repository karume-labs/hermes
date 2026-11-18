"use client";

import {
  type RoutingRuleForm as RoutingRuleFields,
  routingRuleForm,
} from "@hermes/validators";
import { Alert, Button, Group, Select, Text, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { useUpsertRoutingRule } from "@/features/admin/services/mutations";
import { useAdminClinics } from "@/features/admin/services/queries";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

export const RoutingRuleComposer = (): ReactNode => {
  const upsert = useUpsertRoutingRule();
  const clinics = useAdminClinics();
  const clinicOptions = (clinics.data === undefined ? [] : clinics.data).map(
    (clinic) => ({ value: clinic.id, label: clinic.name }),
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoutingRuleFields>({
    resolver: friendlyTypeboxResolver(routingRuleForm),
    defaultValues: { markerPrefix: "", clinicId: "" },
  });

  const onSubmit = (values: RoutingRuleFields) =>
    upsert.mutate(
      {
        markerPrefix: values.markerPrefix.trim().toLowerCase(),
        clinicId: values.clinicId.trim(),
        active: true,
      },
      {
        onSuccess: () => reset({ markerPrefix: "", clinicId: values.clinicId }),
      },
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Group align="flex-start">
        <TextInput
          label="Marker prefix"
          placeholder="hba1c"
          error={errors.markerPrefix?.message}
          {...register("markerPrefix")}
        />
        <Controller
          control={control}
          name="clinicId"
          render={({ field, fieldState }) => (
            <Select
              label="Clinic"
              placeholder={
                clinics.isLoading ? "Loading clinics" : "Choose a clinic"
              }
              data={clinicOptions}
              searchable
              w={240}
              value={field.value === "" ? null : field.value}
              onChange={(next) => field.onChange(next === null ? "" : next)}
              nothingFoundMessage="No clinic matches"
              error={
                clinics.isError
                  ? errorMessage(clinics.error)
                  : fieldState.error?.message
              }
            />
          )}
        />
        <Button type="submit" mt={25} loading={upsert.isPending}>
          Save rule
        </Button>
      </Group>
      {upsert.isError ? (
        <Alert color="red" mt="sm">
          {errorMessage(upsert.error)}
        </Alert>
      ) : null}
      <Text size="xs" c="dimmed" mt={6}>
        Saving an existing prefix replaces its destination clinic.
      </Text>
    </form>
  );
};
