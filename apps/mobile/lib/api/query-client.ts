import { QueryClient } from "@tanstack/react-query";

// Screens remount often on mobile, so data is treated as fresh for a minute and
// a returning patient gets a background refresh rather than a spinner.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
