import type { Booking, PatientBooking, Slot } from "@hermes/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import { usePatientId } from "@/lib/api/patient-profile-queries";
import { queryKeys } from "@/lib/api/query-keys";

export const usePatientBookings = () => {
  const patientId = usePatientId();
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: async () =>
      unwrap(
        await api.patients({ patientId: patientId ?? "" }).bookings.get(),
      ) as PatientBooking[],
    enabled: patientId !== null,
  });
};

export const useSlots = (clinicId: string, kind: Slot["kind"]) =>
  useQuery({
    queryKey: queryKeys.slots(clinicId, kind),
    queryFn: async () =>
      unwrap(await api.clinics({ clinicId }).slots.get()).filter(
        (slot) => slot.kind === kind && slot.heldByCaseId === null,
      ),
    enabled: clinicId !== "",
  });

export const useBookVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      caseId: string;
      slotId: string;
      kind: Slot["kind"];
    }) => unwrap(await api.bookings.post(input)) as Booking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookingId: string; reason: string }) =>
      unwrap(
        await api.bookings({ id: input.bookingId }).cancel.post({
          reason: input.reason,
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings }),
  });
};

export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bookingId: string;
      slotId: string;
      kind: Slot["kind"];
    }) =>
      unwrap(
        await api.bookings({ id: input.bookingId }).reschedule.post({
          slotId: input.slotId,
          kind: input.kind,
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings }),
  });
};
