"use client";

import {
  ActionIcon,
  Group,
  Loader,
  Menu,
  MenuDivider,
  MenuItem,
  MenuLabel,
  Tooltip,
} from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";
import type { ReactNode } from "react";

export interface RowAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface TableRowActionsProps {
  /** Up to two icon buttons; the first two entries are mirrored in the menu. */
  inline?: RowAction[];
  /** The full, ordered list. Destructive items last. */
  menu: RowAction[];
  destructive?: RowAction[];
}

const ActionButton = ({ action }: { action: RowAction }): ReactNode => (
  <Tooltip label={action.label} withArrow openDelay={200}>
    <ActionIcon
      variant="outline"
      color="ink"
      size="sm"
      aria-label={action.label}
      onClick={action.onClick}
      disabled={action.disabled === true || action.loading === true}
    >
      {action.loading === true ? <Loader size={12} /> : action.icon}
    </ActionIcon>
  </Tooltip>
);

export const TableRowActions = ({
  inline = [],
  menu,
  destructive = [],
}: TableRowActionsProps): ReactNode => (
  <Group gap={4} wrap="nowrap" justify="flex-end">
    {inline.slice(0, 2).map((action) => (
      <ActionButton key={action.label} action={action} />
    ))}
    <Menu shadow="md" position="bottom-end" withinPortal width={200}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="ink"
          size="sm"
          aria-label="More actions"
        >
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <MenuLabel>Actions</MenuLabel>
        {menu.map((action) => (
          <MenuItem
            key={action.label}
            leftSection={action.icon}
            onClick={action.onClick}
            disabled={action.disabled === true}
          >
            {action.label}
          </MenuItem>
        ))}
        {destructive.length === 0 ? null : <MenuDivider />}
        {destructive.map((action) => (
          <MenuItem
            key={action.label}
            color="red"
            leftSection={action.icon}
            onClick={action.onClick}
            disabled={action.disabled === true}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu.Dropdown>
    </Menu>
  </Group>
);
