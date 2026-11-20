import type { CaseFeedback } from "@hermes/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import { usePatientId } from "@/lib/api/patient-profile-queries";
import { queryKeys } from "@/lib/api/query-keys";

export const useMarkCaseRead = (caseId: string | undefined) => {
  const patientId = usePatientId();
  return useMutation({
    mutationFn: async () => {
      if (patientId === null || caseId === undefined) return;
      unwrap(await api.patients({ patientId }).cases({ caseId }).read.post({}));
    },
  });
};

export const useSendMessage = (caseId: string | undefined) => {
  const patientId = usePatientId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (patientId === null || caseId === undefined) {
        throw new Error("Open a conversation first.");
      }
      return unwrap(
        await api.patients({ patientId }).cases({ caseId }).messages.post({
          body,
        }),
      );
    },
    onSuccess: () => {
      if (caseId !== undefined) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.messages(caseId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases });
    },
  });
};

export const useAcknowledgeCase = () => {
  const patientId = usePatientId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: string) => {
      if (patientId === null) throw new Error("Sign in again.");
      return unwrap(await api.cases.acknowledge.post({ caseId, patientId }));
    },
    // The open case keeps its own query key, so the acknowledgement only shows
    // up once that detail is invalidated too.
    onSuccess: (_data, caseId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.caseDetail(caseId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

export const useSubmitFeedback = () => {
  const patientId = usePatientId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      caseId: string;
      understood: boolean;
      confidence: number;
      comment?: string;
    }) => {
      if (patientId === null) throw new Error("Sign in again.");
      return unwrap(
        await api
          .patients({ patientId })
          .cases({ caseId: input.caseId })
          .feedback.post({
            understood: input.understood,
            confidence: input.confidence,
            comment: input.comment,
          }),
      ) as CaseFeedback;
    },
    // Without this the saved answer never shows its "Last saved" line.
    onSuccess: (_feedback, input) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.caseDetail(input.caseId),
      }),
  });
};
