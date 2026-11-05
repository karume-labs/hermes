"use client";

import {
  type RoutingRuleForm as RoutingRuleFields,
  routingRuleForm,
} from "@hermes/validators";
import { Alert, Button, Group, Text, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useUpsertRoutingRule } from "@/features/admin/services/mutations";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

export const RoutingRuleComposer = (): ReactNode => {
  const upsert = useUpsertRoutingRule();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoutingRuleFields>({
    resolver: friendlyTypeboxResolver(routingRuleForm),
    defaultValues: { markerPrefix: "", clinicId: "clinic-1" },
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
        <TextInput
          label="Clinic"
          placeholder="clinic-1"
          error={errors.clinicId?.message}
          {...register("clinicId")}
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
