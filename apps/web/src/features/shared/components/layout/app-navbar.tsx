"use client";

import {
  AppShellNavbar,
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
import { NAV_ITEMS } from "@/features/shared/components/layout/nav-items";
import { NavLinkList } from "@/features/shared/components/layout/nav-link-list";

interface AppNavbarProps {
  isExpanded: boolean;
  isAdmin: boolean;
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export const AppNavbar = ({
  isExpanded,
  isAdmin,
  mobileOpened,
  toggleMobile,
}: AppNavbarProps): ReactNode => {
  const pathname = usePathname();
  // The mobile drawer overlays the page, so any tap that navigates has to
  // dismiss it — otherwise the next screen opens behind an open sidebar.
  const closeOnMobile = (): void => {
    if (mobileOpened) toggleMobile();
  };
  const items = NAV_ITEMS.filter((item) => item.adminOnly !== true || isAdmin);
  // Right mark for the surface: the clinic plus inside the care dashboard,
  // the admin shield once you are in administration.
  const surface: "clinic" | "admin" = pathname.startsWith("/admin")
    ? "admin"
    : "clinic";

  return (
    <AppShellNavbar
      p="md"
      bg="transparent"
      withBorder={false}
      styles={{
        navbar: { overflow: "hidden", transition: "width 0.2s ease" },
      }}
    >
      <Paper
        h="100%"
        radius="sm"
        bg="brandChalk.0"
        bd="1px solid var(--mantine-color-brandChalk-3)"
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <UnstyledButton
          component={Link}
          href="/queue"
          aria-label="Hermes queue"
          onClick={closeOnMobile}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            overflow: "hidden",
            justifyContent: isExpanded ? "flex-start" : "center",
            padding: isExpanded ? "14px 16px" : "14px 0",
          }}
        >
          <HermesMark
            variant={surface}
            size={32}
            title={surface === "admin" ? "Hermes admin" : "Hermes clinic"}
          />
          {isExpanded ? <HermesWordmark size={18} /> : null}
        </UnstyledButton>

        <Text
          size="xs"
          fw={700}
          c="brandChalk.6"
          tt="uppercase"
          lts="0.12em"
          px="md"
          pb={6}
          hidden={!isExpanded}
        >
          {isAdmin ? "Administration" : "Care team"}
        </Text>

        <ScrollArea
          flex={1}
          offsetScrollbars={isExpanded}
          type={isExpanded ? "hover" : "never"}
          scrollbarSize={isExpanded ? undefined : 0}
          px="xs"
        >
          <NavLinkList
            items={items}
            expanded={isExpanded}
            onNavigate={closeOnMobile}
          />
        </ScrollArea>

        {isExpanded ? (
          <Text
            size="xs"
            c="brandChalk.5"
            px="md"
            py="sm"
            style={{ borderTop: "1px solid var(--mantine-color-brandChalk-2)" }}
          >
            <IconActivityHeartbeat size={12} style={{ marginRight: 6 }} />
            Screening to sign-off
          </Text>
        ) : null}
      </Paper>
    </AppShellNavbar>
  );
};
