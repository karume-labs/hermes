"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";

const SORTS = ["newest", "oldest"] as const;

const toApiSeverity = (value: string): string => {
  if (value === "urgent") return "Urgent";
  if (value === "actionable") return "Actionable";
  if (value === "routine") return "Routine";
  return "";
};

export interface QueueFilterValue {
  severity: string;
  status: string;
  ownership: string;
  overdue: string;
  search: string;
}

export type QueueFilterPatch = Partial<QueueFilterValue>;

/** Queue filters live in the URL so a link can carry a coordinator's view. */
export const useQueueFilters = () => {
  const [severity, setSeverity] = useQueryState(
    "severity",
    parseAsString.withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [ownership, setOwnership] = useQueryState(
    "ownership",
    parseAsString.withDefault(""),
  );
  const [overdue, setOverdue] = useQueryState(
    "overdue",
    parseAsString.withDefault(""),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("newest"),
  );

  const value: QueueFilterValue = {
    severity,
    status,
    ownership,
    overdue,
    search,
  };

  return {
    value,
    sort,
    setSort: (next: (typeof SORTS)[number]) => void setSort(next),
    severityForApi: toApiSeverity(severity),
    filtersActive: [severity, status, ownership, overdue, search].some(
      (entry) => entry !== "",
    ),
    clear: () => {
      void setSeverity("");
      void setStatus("");
      void setOwnership("");
      void setOverdue("");
      void setSearch("");
    },
    apply: (patch: QueueFilterPatch) => {
      if (patch.severity !== undefined) void setSeverity(patch.severity);
      if (patch.status !== undefined) void setStatus(patch.status);
      if (patch.ownership !== undefined) void setOwnership(patch.ownership);
      if (patch.overdue !== undefined) void setOverdue(patch.overdue);
      if (patch.search !== undefined) void setSearch(patch.search);
    },
  };
};
