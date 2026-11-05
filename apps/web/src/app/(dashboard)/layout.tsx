import type { ReactNode } from "react";
import { AppShellLayout } from "@/features/shared/components/layout/app-shell";

/** proxy.ts owns the redirect; the shell owns the client-side session read. */
const DashboardLayout = ({ children }: { children: ReactNode }): ReactNode => (
  <AppShellLayout>{children}</AppShellLayout>
);

export default DashboardLayout;
