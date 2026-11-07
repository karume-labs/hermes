"use client";

import { NavLink, Stack, Tooltip } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { NavItem } from "@/features/shared/components/layout/nav-items";

const isActive = (pathname: string, item: NavItem): boolean =>
  pathname === item.href ||
  (item.href !== "/queue" && pathname.startsWith(item.href));

const navLinkStyles = (expanded: boolean, active: boolean) => ({
  root: {
    borderRadius: 6,
    height: 44,
    width: expanded ? "auto" : 44,
    margin: expanded ? 0 : "0 auto",
    justifyContent: expanded ? "flex-start" : "center",
    padding: expanded ? "0 12px" : 0,
    backgroundColor: active ? "var(--hermes-surface-tint)" : undefined,
    color: active ? "var(--hermes-ink)" : undefined,
  },
  section: { margin: expanded ? "0 12px 0 0" : 0 },
  body: { display: expanded ? "block" : "none" },
});

export const NavLinkList = ({
  items,
  expanded,
  onNavigate,
}: {
  items: NavItem[];
  expanded: boolean;
  onNavigate: () => void;
}): ReactNode => {
  const pathname = usePathname();

  return (
    <Stack gap={4} py="xs" align={expanded ? "stretch" : "center"}>
      {items.map((item) => {
        const active = isActive(pathname, item);
        const link = (
          <NavLink
            key={item.href}
            component={Link}
            href={item.href}
            label={expanded ? item.label : null}
            aria-label={item.label}
            leftSection={item.icon}
            active={active}
            onClick={onNavigate}
            fw={active ? 700 : 600}
            variant="subtle"
            className="hermes-nav-link"
            styles={navLinkStyles(expanded, active)}
          />
        );

        return expanded ? (
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
  );
};
