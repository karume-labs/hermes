"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useOrganizations = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.organizations.all,
    enabled,
    queryFn: async () => {
      const response = await api.organizations.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });

/** The signed-in staff member's own organization; null for contractors. */
export const useMyOrganization = () =>
  useQuery({
    queryKey: queryKeys.organizations.mine,
    queryFn: async () => {
      const response = await api.organizations.mine.get();
      if (response.error) throw response.error;
      return response.data.organization;
    },
  });

export const useOrganizationClinics = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.organizations.clinics,
    enabled,
    queryFn: async () => {
      const response = await api.organizations.me.clinics.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });
