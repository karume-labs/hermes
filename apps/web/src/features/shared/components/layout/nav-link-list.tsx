"use client";

import { NavLink, Stack, Text, Tooltip } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type {
  NavItem,
  NavSection,
} from "@/features/shared/components/layout/nav-items";

const isActive = (pathname: string, item: NavItem): boolean =>
  pathname === item.href ||
  (item.href !== "/queue" && pathname.startsWith(item.href));

const navLinkStyles = (expanded: boolean, active: boolean) => ({
  root: {
    borderRadius: 8,
    height: 44,
    width: expanded ? "auto" : 44,
    margin: expanded ? 0 : "0 auto",
    justifyContent: expanded ? "flex-start" : "center",
    padding: expanded ? "0 12px" : 0,
    backgroundColor: active ? "var(--hermes-surface-tint)" : undefined,
    color: active ? "var(--hermes-ink)" : "var(--hermes-ink-soft)",
    boxShadow: active
      ? "inset 3px 0 0 var(--hermes-spark), inset 0 0 0 1px var(--hermes-line)"
      : undefined,
  },
  section: { margin: expanded ? "0 10px 0 0" : 0 },
  label: { fontWeight: active ? 700 : 500 },
  body: { display: expanded ? "block" : "none" },
});

const NavEntry = ({
  item,
  expanded,
  active,
  onNavigate,
}: {
  item: NavItem;
  expanded: boolean;
  active: boolean;
  onNavigate: () => void;
}): ReactNode => {
  const link = (
    <NavLink
      component={Link}
      href={item.href}
      label={expanded ? item.label : null}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      leftSection={item.icon}
      active={active}
      onClick={onNavigate}
      variant="subtle"
      className="hermes-nav-link"
      styles={navLinkStyles(expanded, active)}
    />
  );

  if (expanded) return link;

  return (
    <Tooltip
      label={
        <Stack gap={2}>
          <Text size="xs" fw={700}>
            {item.label}
          </Text>
          <Text size="xs" opacity={0.85}>
            {item.description}
          </Text>
        </Stack>
      }
      position="right"
      withArrow
      offset={14}
      multiline
      w={220}
    >
      {link}
    </Tooltip>
  );
};

export const NavLinkList = ({
  sections,
  expanded,
  onNavigate,
}: {
  sections: NavSection[];
  expanded: boolean;
  onNavigate: () => void;
}): ReactNode => {
  const pathname = usePathname();

  return (
    <Stack gap="lg" py="xs" align={expanded ? "stretch" : "center"}>
      {sections.map((section) => (
        <Stack
          key={section.title}
          gap={4}
          align={expanded ? "stretch" : "center"}
        >
          {expanded ? (
            <Text
              size="xs"
              fw={700}
              c="var(--hermes-ink-muted)"
              tt="uppercase"
              lts="0.12em"
              px={10}
              pb={2}
            >
              {section.title}
            </Text>
          ) : null}
          {section.items.map((item) => (
            <NavEntry
              key={item.href}
              item={item}
              expanded={expanded}
              active={isActive(pathname, item)}
              onNavigate={onNavigate}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};
