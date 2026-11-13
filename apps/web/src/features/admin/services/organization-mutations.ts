"use client";

import type {
  ClinicCreate,
  ClinicUpdate,
  NotificationPreferencesBody,
  OrganizationCreate,
} from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrganizationCreate) => {
      const response = await api.organizations.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  });
};

export const useCreateOrgClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClinicCreate) => {
      const response = await api.organizations.me.clinics.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.clinics,
      }),
  });
};

export const useUpdateOrgClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: ClinicUpdate }) => {
      const response = await api.organizations.me
        .clinics({ id: input.id })
        .patch(input.patch);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.clinics,
      }),
  });
};

export const useUpdateOwnPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NotificationPreferencesBody) => {
      const response = await api.staff.me.preferences.patch(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.preferences });
    },
  });
};
