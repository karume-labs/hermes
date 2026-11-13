import type { CaseFeedback, PatientCase } from "@hermes/types";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import { usePatientId } from "@/lib/api/patient-profile-queries";
import { queryKeys } from "@/lib/api/query-keys";

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
