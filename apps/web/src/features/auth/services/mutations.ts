"use client";

import type { SignInBody } from "@hermes/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/services/client";
import { queryKeys } from "@/features/shared/keys/index";

const failureMessage = (message: string | undefined): string =>
  message === undefined ? "Authentication failed" : message;

const useAuthSuccess = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    router.replace("/queue");
    router.refresh();
  };
};

export const useSignIn = () => {
  const onAuthenticated = useAuthSuccess();
  return useMutation({
    mutationFn: async (input: SignInBody) => {
      const response = await authClient.signIn.email(input);
      if (response.error !== null) {
        throw new Error(failureMessage(response.error.message));
      }
      return response.data;
    },
    onSuccess: onAuthenticated,
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const response = await authClient.signOut();
      if (response.error !== null) {
        throw new Error(failureMessage(response.error.message));
      }
      return response.data;
    },
    onSuccess: async () => {
      queryClient.clear();
      router.replace("/sign-in");
      router.refresh();
    },
  });
};
