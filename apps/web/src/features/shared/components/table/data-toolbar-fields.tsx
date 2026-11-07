"use client";

import { MultiSelect, Select, Stack, Text, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar, IconSearch } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { ReactNode } from "react";

export interface ToolbarOption {
  value: string;
  label: string;
}

/** Helper copy sits below the control so described and plain fields align. */
const Field = ({
  description,
  children,
}: {
  description?: string;
  children: ReactNode;
}): ReactNode => (
  <Stack gap={6}>
    {children}
    {description === undefined ? null : (
      <Text size="xs" c="dimmed" lh={1.4}>
        {description}
      </Text>
    )}
  </Stack>
);

export const DataToolbarSearch = ({
  value,
  onChange,
  placeholder,
  description,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  description?: string;
}): ReactNode => (
  <Field description={description}>
    <TextInput
      placeholder={placeholder}
      leftSection={<IconSearch size={16} />}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      w="100%"
    />
  </Field>
);

export const DataToolbarSelect = ({
  label,
  placeholder,
  data,
  value,
  onChange,
  description,
}: {
  label?: string;
  placeholder: string;
  data: ToolbarOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  description?: string;
}): ReactNode => (
  <Field description={description}>
    <Select
      label={label}
      placeholder={placeholder}
      data={data}
      value={value}
      onChange={onChange}
      clearable
      searchable
      w="100%"
      maxDropdownHeight={320}
    />
  </Field>
);

export const DataToolbarMultiSelect = ({
  label,
  placeholder,
  data,
  value,
  onChange,
  description,
}: {
  label?: string;
  placeholder: string;
  data: ToolbarOption[];
  value: string[];
  onChange: (value: string[]) => void;
  description?: string;
}): ReactNode => (
  <Field description={description}>
    <MultiSelect
      label={label}
      placeholder={placeholder}
      data={data}
      value={value}
      onChange={onChange}
      clearable
      searchable
      w="100%"
      maxDropdownHeight={320}
    />
  </Field>
);

export const DataToolbarDateRange = ({
  label,
  placeholder,
  from,
  to,
  onChange,
  description,
}: {
  label?: string;
  placeholder: string;
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  description?: string;
}): ReactNode => (
  <Field description={description}>
    <DatePickerInput
      type="range"
      label={label}
      placeholder={placeholder}
      leftSection={<IconCalendar size={16} />}
      value={[
        from === null ? null : new Date(from),
        to === null ? null : new Date(to),
      ]}
      onChange={([start, end]) => {
        onChange(
          start === null ? null : dayjs(start).format("YYYY-MM-DD"),
          end === null ? null : dayjs(end).format("YYYY-MM-DD"),
        );
      }}
      clearable
      numberOfColumns={2}
      w="100%"
    />
  </Field>
);
