"use client";

import type {
  AcknowledgeBody,
  BookingRequestBody,
  CloseCaseForm,
  ReferralBody,
} from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { env } from "@/features/shared/env/index";
import { queryKeys } from "@/features/shared/keys/index";

const useInvalidateCases = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
};

export const useAcknowledgeCase = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: AcknowledgeBody) => {
      const response = await api.cases.acknowledge.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useBookSlot = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: BookingRequestBody) => {
      const response = await api.bookings.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useLinkReferral = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: ReferralBody) => {
      const response = await api.referrals.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useCloseCase = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: CloseCaseForm) => {
      const response = await api.cases.close.post(input);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useEscalateCase = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (caseId: string) => {
      const response = await api.cases({ id: caseId }).escalate.post();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useSendMessage = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: { caseId: string; body: string }) => {
      const response = await api.cases({ id: input.caseId }).messages.post({
        body: input.body,
        senderId: "coordinator",
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

// Coordinator outreach: stores the message and queues push + SMS so an
// unacknowledged patient is reached on a second channel.
export const useOutreach = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: { caseId: string; body: string }) => {
      const response = await api.cases({ id: input.caseId }).outreach.post({
        body: input.body,
        senderId: "coordinator",
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

// Case documents are posted as multipart so the API can write the file to its
// own disk; metadata comes back with the attachment row.
export const useUploadAttachment = (caseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; kind: string }) => {
      const body = new FormData();
      body.append("file", input.file);
      body.append("kind", input.kind);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/cases/${caseId}/attachments`,
        { method: "POST", body, credentials: "include" },
      );
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(
          failure !== null && typeof failure.message === "string"
            ? failure.message
            : "The file could not be uploaded. Try again.",
        );
      }
      return response.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.detail(caseId),
      }),
  });
};
