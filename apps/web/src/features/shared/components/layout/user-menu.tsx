"use client";

import {
  Avatar,
  Box,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useSignOut } from "@/features/auth/services/mutations";
import type { SessionUser } from "@/features/auth/services/types";
import { Pill } from "@/features/shared/components/ui/pill";

const ROLE_COPY: Record<string, string | undefined> = {
  admin: "Administrator",
  coordinator: "Care coordinator",
  clinician: "Clinician",
};

const initialsOf = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const UserMenu = ({ user }: { user: SessionUser }): ReactNode => {
  const signOut = useSignOut();
  const displayName = user.name.length > 0 ? user.name : user.email;
  const rawRole =
    user.role === null || user.role === undefined ? "" : user.role;
  const roleLabel = ROLE_COPY[rawRole];
  const role = roleLabel === undefined ? "Staff" : roleLabel;

  return (
    <Menu shadow="md" width={260} position="bottom-end" withArrow>
      <MenuTarget>
        <UnstyledButton
          className="hermes-user-trigger"
          aria-label="Account menu"
        >
          <Group gap="xs" wrap="nowrap">
            <Avatar size={30} radius="xl" color="ink">
              {initialsOf(displayName)}
            </Avatar>
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={600} truncate lh={1.3}>
                {displayName}
              </Text>
              <Text size="xs" c="dimmed" truncate lh={1.3}>
                {role}
              </Text>
            </Box>
            <IconChevronDown
              size={14}
              stroke={1.75}
              style={{ flexShrink: 0 }}
            />
          </Group>
        </UnstyledButton>
      </MenuTarget>
      <MenuDropdown>
        <MenuLabel>Signed in as</MenuLabel>
        <Box px="xs" pb="xs">
          <Text size="sm" fw={600} style={{ overflowWrap: "anywhere" }}>
            {displayName}
          </Text>
          <Text size="xs" c="dimmed" style={{ overflowWrap: "anywhere" }}>
            {user.email}
          </Text>
          <Pill
            tone="info"
            size="xs"
            description="Your role decides which pages and actions you can use."
          >
            {role}
          </Pill>
        </Box>
        <MenuDivider />
        <MenuItem
          c="dimmed"
          leftSection={<IconLogout size={16} />}
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </MenuItem>
      </MenuDropdown>
    </Menu>
  );
};
