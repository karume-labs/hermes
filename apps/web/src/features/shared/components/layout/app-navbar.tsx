"use client";

import {
  AppShellNavbar,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconActivityHeartbeat,
  IconArrowsExchange,
  IconBuildingHospital,
  IconCalendarEvent,
  IconChecklist,
  IconHistory,
  IconLayoutDashboard,
  IconRoute,
  IconSend,
  IconStethoscope,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  HermesMark,
  HermesWordmark,
} from "@/features/shared/components/brand/hermes-mark";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Queue", href: "/queue", icon: <IconStethoscope size={20} /> },
  {
    label: "Appointments",
    href: "/appointments",
    icon: <IconCalendarEvent size={20} />,
  },
  { label: "Patients", href: "/patients", icon: <IconUsers size={20} /> },
  {
    label: "Referrals",
    href: "/referrals",
    icon: <IconArrowsExchange size={20} />,
  },
  { label: "Tasks", href: "/tasks", icon: <IconChecklist size={20} /> },
  {
    label: "Overview",
    href: "/admin",
    icon: <IconLayoutDashboard size={20} />,
    adminOnly: true,
  },
  {
    label: "Clinics",
    href: "/admin/clinics",
    icon: <IconBuildingHospital size={20} />,
    adminOnly: true,
  },
  {
    label: "Audit trail",
    href: "/admin/audit",
    icon: <IconHistory size={20} />,
    adminOnly: true,
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: <IconSend size={20} />,
    adminOnly: true,
  },
  {
    label: "Integrations",
    href: "/admin/webhooks",
    icon: <IconWebhook size={20} />,
    adminOnly: true,
  },
  {
    label: "Routing rules",
    href: "/admin/routing",
    icon: <IconRoute size={20} />,
    adminOnly: true,
  },
  {
    label: "Staff access",
    href: "/admin/staff",
    icon: <IconUsers size={20} />,
    adminOnly: true,
  },
];

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
          <Stack gap={4} py="xs" align={isExpanded ? "stretch" : "center"}>
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/queue" && pathname.startsWith(item.href));

              const link = (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={isExpanded ? item.label : null}
                  aria-label={item.label}
                  leftSection={item.icon}
                  active={active}
                  onClick={closeOnMobile}
                  fw={active ? 700 : 600}
                  variant="subtle"
                  className="hermes-nav-link"
                  styles={{
                    root: {
                      borderRadius: 6,
                      height: 44,
                      width: isExpanded ? "auto" : 44,
                      margin: isExpanded ? 0 : "0 auto",
                      justifyContent: isExpanded ? "flex-start" : "center",
                      padding: isExpanded ? "0 12px" : 0,
                      backgroundColor: active
                        ? "var(--hermes-surface-tint)"
                        : undefined,
                      color: active ? "var(--hermes-ink)" : undefined,
                    },
                    section: { margin: isExpanded ? "0 12px 0 0" : 0 },
                    body: { display: isExpanded ? "block" : "none" },
                  }}
                />
              );

              return isExpanded ? (
                link
              ) : (
                <Tooltip
                  key={item.href}
                  label={item.label}
                  position="right"
                  withArrow
                  offset={15}
                >
                  {link}
                </Tooltip>
              );
            })}
          </Stack>
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
