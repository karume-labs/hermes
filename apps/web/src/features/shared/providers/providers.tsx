"use client";

import { MantineProvider } from "@mantine/core";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { TanstackQueryClientProvider } from "@/features/shared/providers/tanstack-query-client-provider";
import { theme } from "@/features/shared/styles/theme";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps): ReactNode => (
  <MantineProvider theme={theme} defaultColorScheme="auto">
    <Suspense>
      <NuqsAdapter>
        <TanstackQueryClientProvider>{children}</TanstackQueryClientProvider>
      </NuqsAdapter>
    </Suspense>
  </MantineProvider>
);
