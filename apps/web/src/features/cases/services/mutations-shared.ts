"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/shared/keys/index";

export const useInvalidateCases = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
};
