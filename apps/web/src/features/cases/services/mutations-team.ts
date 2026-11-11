"use client";

import type { HandoverBody } from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

/** Clinician-to-clinician hand-over: the receiver owns, the sender keeps read. */
export const useHandoverCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: HandoverBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId }).handover.post({
        toUserId: input.toUserId,
        note: input.note,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (result) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.detail(result.careCase.id),
      }),
  });
};

export const useAddCaseClinician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      caseId: string;
      userId: string;
      access: "collaborator" | "read";
    }) => {
      const response = await api.cases({ id: input.caseId }).clinicians.post({
        userId: input.userId,
        access: input.access,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.detail(input.caseId),
      }),
  });
};

export const useRemoveCaseClinician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { caseId: string; userId: string }) => {
      const response = await api
        .cases({ id: input.caseId })
        .clinicians({ userId: input.userId })
        .delete();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.detail(input.caseId),
      }),
  });
};
