"use client";

import type { StaffRole } from "@hermes/types";
import {
  ActionIcon,
  AppShell,
  AppShellHeader,
  AppShellMain,
  Burger,
  Group,
  Paper,
  Skeleton,
  Tooltip,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { IconLayoutSidebar } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { authClient } from "@/features/auth/services/client";
import { AppNavbar } from "@/features/shared/components/layout/app-navbar";
import { ThemeToggle } from "@/features/shared/components/layout/theme-toggle";
import { UserMenu } from "@/features/shared/components/layout/user-menu";

const HEADER_HEIGHT = 76;
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 96;
const SIDEBAR_STORAGE_KEY = "hermes-sidebar-expanded";

interface AppShellLayoutProps {
  children: ReactNode;
}

/** Shown while the client session read lands: the shell, not a white page. */
const ShellSkeleton = (): ReactNode => (
  <div className="hermes-shell-skeleton">
    <Skeleton height={56} radius="lg" />
    <Skeleton height={420} radius="lg" />
  </div>
);

export const AppShellLayout = ({
  children,
}: AppShellLayoutProps): ReactNode => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [isExpanded, setIsExpanded] = useLocalStorage({
    key: SIDEBAR_STORAGE_KEY,
    defaultValue: true,
  });
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // proxy.ts already blocks signed-out traffic; this covers client-side
  // navigation and expired sessions without a server fetch in the layout.
  useEffect(() => {
    if (!isPending && session === null) router.replace("/sign-in");
  }, [isPending, session, router]);

  // `useSession` reports `isPending` until the read lands; until then the menu
  // keeps its placeholder instead of flashing a signed-out header.
  const user = isPending || session === null ? null : session.user;
  const panelRole: StaffRole =
    user?.role === "admin" ||
    user?.role === "clinician" ||
    user?.role === "org_admin"
      ? user.role
      : "coordinator";

  return (
    <AppShell
      layout="alt"
      header={{ height: HEADER_HEIGHT }}
      navbar={{
        width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
        breakpoint: "md",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="lg"
      bg="var(--hermes-canvas)"
      c="var(--hermes-ink)"
      styles={{
        main: { width: "100%", maxWidth: 1480, margin: "0 auto" },
      }}
    >
      <AppShellHeader withBorder={false} px="md" pt="md" bg="transparent">
        <Paper
          h="100%"
          px="md"
          radius="lg"
          bg="var(--hermes-surface)"
          withBorder
          style={{ overflow: "hidden" }}
        >
          <Group h="100%" justify="space-between" wrap="nowrap" gap="sm">
            <Group gap="xs" wrap="nowrap">
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="md"
                size="sm"
                color="var(--hermes-ink)"
              />
              <Tooltip
                label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                withArrow
                position="bottom"
              >
                <ActionIcon
                  variant="subtle"
                  color="var(--hermes-ink)"
                  size="lg"
                  onClick={() => setIsExpanded((open) => !open)}
                  visibleFrom="md"
                  aria-label="Toggle sidebar"
                >
                  <IconLayoutSidebar size={22} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <ThemeToggle />
              {user === null ? (
                <Group gap="xs" wrap="nowrap" px="sm">
                  <Skeleton height={30} circle />
                  <Skeleton height={14} width={90} radius="sm" />
                </Group>
              ) : (
                <UserMenu user={user} />
              )}
            </Group>
          </Group>
        </Paper>
      </AppShellHeader>

      <AppNavbar
        isExpanded={isExpanded}
        role={panelRole}
        mobileOpened={mobileOpened}
        toggleMobile={toggleMobile}
      />

      <AppShellMain>{isPending ? <ShellSkeleton /> : children}</AppShellMain>
    </AppShell>
  );
};
