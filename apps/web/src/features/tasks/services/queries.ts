"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useTasks = (status: string) => {
  const query = useQuery({
    queryKey: queryKeys.tasks.list(status),
    queryFn: async () => {
      const response = await api.tasks.get({ query: { status } });
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });
  return { ...query, tasks: query.data === undefined ? [] : query.data };
};
