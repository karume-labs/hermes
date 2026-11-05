"use client";

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
