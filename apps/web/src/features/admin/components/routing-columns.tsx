"use client";

import type { RoutingRule } from "@hermes/types";
import { Switch, Text } from "@mantine/core";
import { IconPower, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { TableRowActions } from "@/features/shared/components/table/table-row-actions";
import { Pill } from "@/features/shared/components/ui/pill";

interface RoutingColumnActions {
  upserting: boolean;
  removing: boolean;
  clinicLabel: (clinicId: string) => string;
  onSetActive: (rule: RoutingRule, active: boolean) => void;
  onRemove: (id: string) => void;
}

/** Same actions in the switch and the row menu: task first, destructive last. */
export const routingColumns = ({
  upserting,
  removing,
  clinicLabel,
  onSetActive,
  onRemove,
}: RoutingColumnActions): ColumnDef<RoutingRule, unknown>[] => [
  {
    id: "prefix",
    header: "Marker prefix",
    accessorFn: (row) => row.markerPrefix,
    cell: ({ row }): ReactNode => (
      <Text ff="monospace" size="sm">
        {row.original.markerPrefix}
      </Text>
    ),
  },
  {
    id: "clinic",
    header: "Clinic",
    accessorFn: (row) => clinicLabel(row.clinicId),
    cell: ({ row }): ReactNode => (
      <Pill tone="info">{clinicLabel(row.original.clinicId)}</Pill>
    ),
  },
  {
    id: "active",
    header: "Active",
    accessorFn: (row) => (row.active ? 1 : 0),
    cell: ({ row }): ReactNode => (
      <Switch
        aria-label={`Rule for ${row.original.markerPrefix} active`}
        checked={row.original.active}
        onChange={(event) =>
          onSetActive(row.original, event.currentTarget.checked)
        }
      />
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }): ReactNode => (
      <TableRowActions
        menu={[
          {
            label: row.original.active ? "Pause this rule" : "Resume this rule",
            icon: <IconPower size={15} />,
            loading: upserting,
            onClick: () => onSetActive(row.original, !row.original.active),
          },
        ]}
        destructive={[
          {
            label: "Remove rule",
            icon: <IconTrash size={15} />,
            loading: removing,
            onClick: () => onRemove(row.original.id),
          },
        ]}
      />
    ),
  },
];
