"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useQueueCases = (severity: string, status: string) => {
  const query = useQuery({
    queryKey: queryKeys.cases.list({ severity, status }),
    queryFn: async () => {
      const response = await api.cases.get({ query: { severity, status } });
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });
  return { ...query, cases: query.data === undefined ? [] : query.data };
};
