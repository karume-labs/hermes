"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

/**
 * The queue's test button: the API picks a patient in the caller's clinic,
 * creates a result and runs the same triage a real lab feed would, so the team
 * can watch routing, ownership and notifications happen end to end.
 */
export const useIngestLabResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.cases["demo-result"].post();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
};
