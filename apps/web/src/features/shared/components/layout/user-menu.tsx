"use client";

import {
  Avatar,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Skeleton,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useSignOut } from "@/features/auth/services/mutations";
import type { SessionUser } from "@/features/auth/services/types";

interface UserMenuProps {
  user: SessionUser | null;
}

const initialsOf = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const UserMenu = ({ user }: UserMenuProps): ReactNode => {
  const signOut = useSignOut();

  if (user === null) {
    return (
      <Group gap="xs" wrap="nowrap" px="sm">
        <Skeleton height={30} circle />
        <Skeleton height={16} width={90} radius="xl" />
      </Group>
    );
  }

  const displayName = user.name.length > 0 ? user.name : user.email;

  return (
    <Menu shadow="md" width={260} position="bottom-end" withArrow>
      <MenuTarget>
        <UnstyledButton
          className="hermes-user-trigger"
          aria-label="Account menu"
        >
          <Group gap="xs" wrap="nowrap">
            <Avatar size={30} radius="xl" color="brandSlate.9">
              {initialsOf(displayName)}
            </Avatar>
            <Group gap={6} wrap="nowrap" visibleFrom="sm">
              <Text size="sm" fw={600} truncate maw={140}>
                {displayName}
              </Text>
              <Text size="xs" c="dimmed" tt="capitalize">
                {user.role}
              </Text>
            </Group>
            <IconChevronDown size={14} stroke={1.75} />
          </Group>
        </UnstyledButton>
      </MenuTarget>
      <MenuDropdown>
        <MenuLabel>Signed in as</MenuLabel>
        <Text px="xs" py="xs" size="sm" style={{ overflowWrap: "anywhere" }}>
          {user.email}
        </Text>
        <MenuDivider />
        <MenuItem
          c="dimmed"
          leftSection={<IconLogout size={16} />}
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          Sign out
        </MenuItem>
      </MenuDropdown>
    </Menu>
  );
};
