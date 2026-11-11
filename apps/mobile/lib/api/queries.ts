import type {
  Booking,
  CaseFeedback,
  MobileEventType,
  NotificationPreference,
  PatientBooking,
  PatientCase,
  Slot,
} from "@hermes/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import type { PatientProfile } from "@/lib/token-store";

export const queryKeys = {
  profile: ["patient", "profile"] as const,
  cases: ["patient", "cases"] as const,
  caseDetail: (caseId: string) => ["patient", "case", caseId] as const,
  messages: (caseId: string) => ["patient", "messages", caseId] as const,
  bookings: ["patient", "bookings"] as const,
  notifications: ["patient", "notifications"] as const,
  slots: (clinicId: string, kind: string) =>
    ["patient", "slots", clinicId, kind] as const,
} as const;

export interface PatientCaseDetail extends PatientCase {
  messages: {
    id: string;
    caseId: string;
    sender: string;
    senderId: string;
    body: string;
    readAt: string | null;
    createdAt: string;
  }[];
  notifications: unknown[];
  feedback: CaseFeedback | null;
}

export const usePatientProfile = () =>
  useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () =>
      unwrap(await api["patient-auth"].session.get()).patient as PatientProfile,
    retry: false,
  });

/** The signed-in patient's id, available to every tab without prop drilling. */
export const usePatientId = (): string | null => {
  const profile = usePatientProfile();
  return profile.data?.id ?? null;
};

export const usePatientCases = () => {
  const patientId = usePatientId();
  return useQuery({
    queryKey: queryKeys.cases,
    queryFn: async () =>
      unwrap(await api.patients({ patientId: patientId ?? "" }).cases.get()),
    enabled: patientId !== null,
    refetchOnMount: "always",
  });
};

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

export const usePatientNotifications = () => {
  const patientId = usePatientId();
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () =>
      unwrap(
        await api.patients({ patientId: patientId ?? "" }).notifications.get(),
      ),
    enabled: patientId !== null,
    refetchOnMount: "always",
  });
};

export const usePatientCase = (caseId: string | undefined) => {
  const patientId = usePatientId();
  return useQuery({
    queryKey: queryKeys.caseDetail(caseId ?? ""),
    queryFn: async () =>
      unwrap(
        await api
          .patients({ patientId: patientId ?? "" })
          .cases({ caseId: caseId ?? "" })
          .get(),
      ) as PatientCaseDetail,
    enabled: patientId !== null && caseId !== undefined,
  });
};

export const useCaseMessages = (caseId: string | undefined) => {
  const patientId = usePatientId();
  return useQuery({
    queryKey: queryKeys.messages(caseId ?? ""),
    queryFn: async () =>
      unwrap(
        await api
          .patients({ patientId: patientId ?? "" })
          .cases({ caseId: caseId ?? "" })
          .messages.get(),
      ),
    enabled: patientId !== null && caseId !== undefined,
  });
};

export const useMarkCaseRead = (caseId: string | undefined) => {
  const patientId = usePatientId();
  return useMutation({
    mutationFn: async () => {
      if (patientId === null || caseId === undefined) return;
      unwrap(await api.patients({ patientId }).cases({ caseId }).read.post({}));
    },
  });
};

export const useMarkNotificationRead = () => {
  const patientId = usePatientId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (patientId === null) return;
      unwrap(
        await api
          .patients({ patientId })
          .notifications({ notificationId })
          .read.post({}),
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
};

export const useUpdateConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      pushConsent: boolean;
      smsConsent: boolean;
      emailConsent: boolean;
      notificationChannel: NotificationPreference;
    }) =>
      unwrap(await api["patient-auth"].consent.patch(input)) as PatientProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile, profile);
    },
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

export const useSubmitFeedback = () => {
  const patientId = usePatientId();
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
  });
};

export const useRegisterDevice = () => {
  const patientId = usePatientId();
  return useMutation({
    mutationFn: async (input: { token: string; platform: string }) => {
      if (patientId === null) return;
      const platform =
        input.platform === "ios" ||
        input.platform === "android" ||
        input.platform === "web"
          ? input.platform
          : "android";
      unwrap(
        await api.patients({ patientId }).devices.post({
          token: input.token,
          platform,
        }),
      );
    },
  });
};

export const useRecordEvent = () => {
  const patientId = usePatientId();
  return useMutation({
    mutationFn: async (input: { type: MobileEventType; caseId?: string }) => {
      if (patientId === null) return;
      unwrap(await api.patients({ patientId }).events.post(input));
    },
  });
};
