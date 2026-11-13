import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { PatientProfile } from "@/lib/token-store";

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
