"use client";

import type {
  AcknowledgeBody,
  BookingRequestBody,
  CloseCaseForm,
  ReferralBody,
} from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
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
