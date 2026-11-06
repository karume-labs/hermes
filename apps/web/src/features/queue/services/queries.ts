"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useQueueCases = (
  severity: string,
  status: string,
  assigned = "",
  unassigned = "",
  overdue = "",
) => {
  const query = useQuery({
    queryKey: queryKeys.cases.list({
      severity,
      status,
      assigned,
      unassigned,
      overdue,
    }),
    queryFn: async () => {
      const response = await api.cases.get({
        query: { severity, status, assigned, unassigned, overdue },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });
  return { ...query, cases: query.data === undefined ? [] : query.data };
};
