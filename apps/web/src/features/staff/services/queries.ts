"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: queryKeys.staff.preferences,
    queryFn: async () => {
      const response = await api.staff.me.preferences.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });
