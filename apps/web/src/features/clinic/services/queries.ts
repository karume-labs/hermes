"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useClinicAppointments = () =>
  useQuery({
    queryKey: queryKeys.clinic.appointments,
    queryFn: async () => {
      const response = await api.clinic.appointments.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });

export const useClinicPatients = () =>
  useQuery({
    queryKey: queryKeys.clinic.patients,
    queryFn: async () => {
      const response = await api.clinic.patients.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 60_000,
  });

export const useClinicReferrals = () =>
  useQuery({
    queryKey: queryKeys.clinic.referrals,
    queryFn: async () => {
      const response = await api.clinic.referrals.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 60_000,
  });
