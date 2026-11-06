"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useCaseDetail = (caseId: string) =>
  useQuery({
    queryKey: queryKeys.cases.detail(caseId),
    queryFn: async () => {
      const response = await api.cases({ id: caseId }).get();
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: caseId !== "",
    refetchInterval: 30_000,
  });

export const useClinicSlots = (clinicId: string) =>
  useQuery({
    queryKey: queryKeys.slots(clinicId),
    queryFn: async () => {
      const response = await api.clinics({ clinicId }).slots.get();
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: clinicId !== "",
  });

export const useCareTeam = () =>
  useQuery({
    queryKey: queryKeys.staff.team,
    queryFn: async () => {
      const response = await api.staff.team.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });

export const useReferralClinics = () =>
  useQuery({
    queryKey: queryKeys.clinics,
    queryFn: async () => {
      const response = await api.clinics.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });
