"use client";

import type {
  ClinicCreate,
  ClinicUpdate,
  CreateStaffInvite,
  UpdateStaffUser,
} from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useUpsertRoutingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      markerPrefix: string;
      clinicId: string;
      active: boolean;
    }) => {
      const response = await api["routing-rules"].put(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.routingRules }),
  });
};

export const useDeleteRoutingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api["routing-rules"]({ id }).delete();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.routingRules }),
  });
};

export const useCreateStaffInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStaffInvite) => {
      const response = await api.staff.invites.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.invites }),
  });
};

export const useRevokeStaffInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.staff.invites({ id }).delete();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.invites }),
  });
};

export const useUpdateStaffUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: UpdateStaffUser }) => {
      const response = await api.staff
        .users({ id: input.id })
        .patch(input.patch);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.users }),
  });
};

export const useCreateClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClinicCreate) => {
      const response = await api.admin.clinics.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clinics }),
  });
};

export const useUpdateClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: ClinicUpdate }) => {
      const response = await api.admin
        .clinics({ id: input.id })
        .patch(input.patch);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clinics }),
  });
};

export const useSetClinicActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; isActive: boolean }) => {
      const response = await api.admin.clinics({ id: input.id }).patch({
        isActive: input.isActive,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clinics }),
  });
};

export const useDispatchNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.notifications.dispatch.post();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};
