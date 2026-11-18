"use client";

import type { StaffRole } from "@hermes/types";
import { Group, Text } from "@mantine/core";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navSections } from "@/features/shared/components/layout/nav-items";

/**
 * The header answers "where am I" without a breadcrumb trail: the section icon
 * and name of the deepest nav entry that matches the current path.
 */
export const HeaderContext = ({ role }: { role: StaffRole }): ReactNode => {
  const pathname = usePathname();
  const items = navSections(role).flatMap((section) => section.items);
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;

  const active = matches.reduce((deepest, item) =>
    item.href.length > deepest.href.length ? item : deepest,
  );

  return (
    <Group
      gap={10}
      wrap="nowrap"
      pl="xs"
      visibleFrom="sm"
      style={{ borderLeft: "1px solid var(--hermes-line)", height: 26 }}
    >
      <Text c="var(--hermes-ink-muted)" lh={0} aria-hidden>
        {active.icon}
      </Text>
      <Text fw={800} size="md" c="var(--hermes-ink)" truncate>
        {active.label}
      </Text>
    </Group>
  );
};
