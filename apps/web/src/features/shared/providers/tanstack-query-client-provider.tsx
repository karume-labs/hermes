"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

interface TanstackQueryClientProviderProps {
  children: ReactNode;
}

export const TanstackQueryClientProvider = ({
  children,
}: TanstackQueryClientProviderProps): ReactNode => {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
