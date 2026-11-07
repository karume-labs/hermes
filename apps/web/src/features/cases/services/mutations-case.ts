"use client";
import type {
  AcknowledgeBody,
  AssignCaseBody,
  BookingRequestBody,
  CloseCaseForm,
} from "@hermes/validators";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCases } from "@/features/cases/services/mutations-shared";
import { api } from "@/features/shared/api/index";

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

export const useAssignCase = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: AssignCaseBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId }).assign.post({
        assignedToId: input.assignedToId,
      });
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
