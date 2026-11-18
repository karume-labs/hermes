import { Skeleton } from "@mantine/core";
import type { ReactNode } from "react";

/** Shown while the client session read lands: the shell, not a white page. */
export const ShellSkeleton = (): ReactNode => (
  <div className="hermes-shell-skeleton">
    <Skeleton height={56} radius="lg" />
    <Skeleton height={420} radius="lg" />
  </div>
);
