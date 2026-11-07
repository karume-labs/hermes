"use client";

import type { BookingOutcome } from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

const useRefreshSchedule = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.clinic.appointments,
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
  };
};

export const useCancelClinicBooking = () => {
  const refresh = useRefreshSchedule();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.bookings({ id: bookingId }).cancel.post({
        reason: "Cancelled from the clinic schedule",
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: refresh,
  });
};

export const useRescheduleClinicBooking = () => {
  const refresh = useRefreshSchedule();
  return useMutation({
    mutationFn: async (input: {
      bookingId: string;
      slotId: string;
      kind: "in_person" | "telehealth";
    }) => {
      const response = await api
        .bookings({ id: input.bookingId })
        .reschedule.post({ slotId: input.slotId, kind: input.kind });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: refresh,
  });
};

export const useRecordBookingOutcome = () => {
  const refresh = useRefreshSchedule();
  return useMutation({
    mutationFn: async (input: { bookingId: string } & BookingOutcome) => {
      const response = await api
        .bookings({ id: input.bookingId })
        .outcome.patch({
          status: input.status,
        });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: refresh,
  });
};
