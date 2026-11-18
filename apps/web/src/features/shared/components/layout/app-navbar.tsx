"use client";

import type { StaffRole } from "@hermes/types";
import {
  AppShellNavbar,
  Group,
  Paper,
  ScrollArea,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconActivityHeartbeat } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  HermesMark,
  HermesWordmark,
} from "@/features/shared/components/brand/hermes-mark";
import { navSections } from "@/features/shared/components/layout/nav-items";
import { NavLinkList } from "@/features/shared/components/layout/nav-link-list";

interface AppNavbarProps {
  isExpanded: boolean;
  role: StaffRole;
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export const AppNavbar = ({
  isExpanded,
  role,
  mobileOpened,
  toggleMobile,
}: AppNavbarProps): ReactNode => {
  const pathname = usePathname();
  // The mobile drawer overlays the page, so any tap that navigates has to
  // dismiss it — otherwise the next screen opens behind an open sidebar.
  const closeOnMobile = (): void => {
    if (mobileOpened) toggleMobile();
  };
  const sections = navSections(role);
  // Right mark for the surface: the admin shield in administration, the clinic
  // plus everywhere else.
  const surface: "clinic" | "admin" = pathname.startsWith("/admin")
    ? "admin"
    : "clinic";

  return (
    <AppShellNavbar
      p="md"
      bg="transparent"
      withBorder={false}
      className="hermes-sidebar"
      data-collapsed={!isExpanded}
    >
      <Paper
        h="100%"
        radius="lg"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <UnstyledButton
          component={Link}
          href="/queue"
          aria-label="Hermes queue"
          onClick={closeOnMobile}
          className="hermes-sidebar-brand hermes-brand-band"
        >
          <HermesMark
            variant={surface}
            size={30}
            title={surface === "admin" ? "Hermes admin" : "Hermes clinic"}
          />
          <span
            className="hermes-sidebar-fade"
            data-visible={isExpanded}
            aria-hidden={!isExpanded}
            style={{ display: "grid", gap: 2 }}
          >
            <HermesWordmark size={17} color="var(--hermes-on-brand)" />
            <Text
              size="9px"
              fw={700}
              tt="uppercase"
              lts="0.2em"
              c="var(--hermes-on-brand-muted)"
              lh={1}
            >
              {surface === "admin" ? "Admin console" : "Care console"}
            </Text>
          </span>
        </UnstyledButton>

        <ScrollArea
          flex={1}
          offsetScrollbars={isExpanded}
          type={isExpanded ? "hover" : "never"}
          scrollbarSize={isExpanded ? undefined : 0}
          px="xs"
        >
          <NavLinkList
            sections={sections}
            expanded={isExpanded}
            onNavigate={closeOnMobile}
          />
        </ScrollArea>

        <div className="hermes-sidebar-fade" data-visible={isExpanded}>
          <Group
            gap={8}
            px="md"
            py="sm"
            wrap="nowrap"
            style={{ borderTop: "1px solid var(--hermes-line)" }}
          >
            <IconActivityHeartbeat
              size={13}
              color="var(--hermes-accent)"
              aria-hidden
            />
            <Text size="xs" c="var(--hermes-ink-muted)" truncate>
              Screening to sign-off
            </Text>
          </Group>
        </div>
      </Paper>
    </AppShellNavbar>
  );
};
