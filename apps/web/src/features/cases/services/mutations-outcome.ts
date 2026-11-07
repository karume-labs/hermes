"use client";
import type {
  RecordConfirmationBody,
  RecordConsultationBody,
  RecordDropOffBody,
  RecordSurveillanceBody,
  RecordTreatmentBody,
} from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInvalidateCases } from "@/features/cases/services/mutations-shared";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useRecordConfirmation = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: RecordConfirmationBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId }).confirmation.post({
        status: input.status,
        notes: input.notes,
        occurredAt: input.occurredAt,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useRecordConsultation = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: RecordConsultationBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId }).consultation.post({
        outcome: input.outcome,
        notes: input.notes,
        occurredAt: input.occurredAt,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useRecordTreatment = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: RecordTreatmentBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId }).treatment.post({
        summary: input.summary,
        startedAt: input.startedAt,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useRecordSurveillance = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: RecordSurveillanceBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId }).surveillance.post({
        plan: input.plan,
        nextReviewAt: input.nextReviewAt,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useRecordDropOff = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: RecordDropOffBody & { caseId: string }) => {
      const response = await api.cases({ id: input.caseId })["drop-off"].post({
        reason: input.reason,
        note: input.note,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useAddConsultNote = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: { caseId: string; body: string }) => {
      const response = await api
        .cases({ id: input.caseId })
        ["consult-notes"].post({ body: input.body });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};

export const useCompleteTask = () => {
  const invalidate = useInvalidateCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.tasks({ id: taskId }).complete.post();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};
