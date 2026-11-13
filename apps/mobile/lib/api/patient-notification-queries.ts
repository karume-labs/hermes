import type { MobileEventType, NotificationPreference } from "@hermes/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import { usePatientId } from "@/lib/api/patient-profile-queries";
import { queryKeys } from "@/lib/api/query-keys";
import type { PatientProfile } from "@/lib/token-store";

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
