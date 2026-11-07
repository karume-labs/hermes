"use client";
import type { ReferralBody } from "@hermes/validators";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCases } from "@/features/cases/services/mutations-shared";
import { api } from "@/features/shared/api/index";

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

export const useReferralDecision = () => {
  const invalidate = useInvalidateCases();
  return useMutation({
    mutationFn: async (input: {
      referralId: string;
      action: "accept" | "decline" | "complete";
      reason?: string;
      assignedToId?: string;
    }) => {
      const target = api.referrals({ id: input.referralId });
      const response =
        input.action === "accept"
          ? await target.accept.post({ assignedToId: input.assignedToId })
          : input.action === "decline"
            ? await target.decline.post({ reason: input.reason })
            : await target.complete.post();
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: invalidate,
  });
};
