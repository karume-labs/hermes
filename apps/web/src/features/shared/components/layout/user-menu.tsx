"use client";

import {
  Avatar,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { useSignOut } from "@/features/auth/services/mutations";
import type { SessionUser } from "@/features/auth/services/types";

interface UserMenuProps {
  user: SessionUser;
}

const initials = (name: string): string =>
  name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const UserMenu = ({ user }: UserMenuProps) => {
  const signOut = useSignOut();

  return (
    <Menu position="bottom-end" width={220} withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar color="teal.3" radius="xl" size={32}>
              {initials(user.name)}
            </Avatar>
            <Stack gap={0} visibleFrom="sm">
              <Text size="sm" fw={600} c="white" lh={1.2}>
                {user.name}
              </Text>
              <Text size="xs" c="teal.2" tt="capitalize">
                {user.role}
              </Text>
            </Stack>
            <IconChevronDown size={16} color="white" />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.email}</Menu.Label>
        <Menu.Item leftSection={<IconUser size={16} />} disabled>
          {user.role === "admin" ? "Administrator" : "Care coordinator"}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
