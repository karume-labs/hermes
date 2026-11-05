"use client";

import {
  ActionIcon,
  AppShell,
  AppShellHeader,
  AppShellMain,
  Burger,
  Center,
  Group,
  Loader,
  Paper,
  Tooltip,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { IconLayoutSidebar } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { authClient } from "@/features/auth/services/client";
import { AppNavbar } from "@/features/shared/components/layout/app-navbar";
import { UserMenu } from "@/features/shared/components/layout/user-menu";

const HEADER_HEIGHT = 76;
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 96;
const SIDEBAR_STORAGE_KEY = "hermes-sidebar-expanded";

interface AppShellLayoutProps {
  children: ReactNode;
}

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

  if (session === null) {
    return (
      <Center mih="100vh" bg="brandChalk.1">
        <Loader size="sm" color="brandSlate.9" />
      </Center>
    );
  }

  const user = session.user;
  const isAdmin = user.role === "admin";

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
      bg="brandChalk.1"
      c="brandSlate.9"
      styles={{
        main: { width: "100%", maxWidth: 1480, margin: "0 auto" },
      }}
    >
      <AppShellHeader withBorder={false} px="md" pt="md" bg="transparent">
        <Paper h="100%" px="md" radius="sm" bg="brandChalk.0" withBorder>
          <Group h="100%" justify="space-between">
            <Group gap="xs">
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="md"
                size="sm"
                color="brandSlate.9"
              />
              <Tooltip
                label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                withArrow
                position="bottom"
              >
                <ActionIcon
                  variant="subtle"
                  color="brandSlate.9"
                  size="lg"
                  onClick={() => setIsExpanded((open) => !open)}
                  visibleFrom="md"
                  aria-label="Toggle sidebar"
                >
                  <IconLayoutSidebar size={22} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <UserMenu user={user} />
          </Group>
        </Paper>
      </AppShellHeader>

      <AppNavbar
        isExpanded={isExpanded}
        isAdmin={isAdmin}
        mobileOpened={mobileOpened}
        toggleMobile={toggleMobile}
      />

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
};
