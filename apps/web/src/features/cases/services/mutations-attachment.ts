"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "@/features/shared/env/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useUploadAttachment = (caseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; kind: string }) => {
      const body = new FormData();
      body.append("file", input.file);
      body.append("kind", input.kind);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/cases/${caseId}/attachments`,
        { method: "POST", body, credentials: "include" },
      );
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(
          failure !== null && typeof failure.message === "string"
            ? failure.message
            : "The file could not be uploaded. Try again.",
        );
      }
      return response.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.detail(caseId),
      }),
  });
};
