"use client";

import type { AdminClinicSummary } from "@hermes/types";
import { Alert, Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  useCreateClinic,
  useUpdateClinic,
} from "@/features/admin/services/mutations";
import { errorMessage } from "@/features/shared/utils/form-errors";

interface ClinicFormModalProps {
  opened: boolean;
  clinic: AdminClinicSummary | null;
  onClose: () => void;
}

export const ClinicFormModal = ({
  opened,
  clinic,
  onClose,
}: ClinicFormModalProps): ReactNode => {
  const create = useCreateClinic();
  const update = useUpdateClinic();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Africa/Nairobi");

  useEffect(() => {
    if (!opened) return;
    setId(clinic?.id ?? "");
    setName(clinic?.name ?? "");
    setTimezone(clinic?.timezone ?? "Africa/Nairobi");
  }, [clinic, opened]);

  const editing = clinic !== null;
  const busy = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  const save = (): void => {
    if (name.trim().length < 2) return;
    if (editing) {
      update.mutate(
        {
          id: clinic.id,
          patch: { name: name.trim(), timezone: timezone.trim() },
        },
        { onSuccess: onClose },
      );
      return;
    }
    create.mutate(
      {
        id: id.trim(),
        name: name.trim(),
        timezone: timezone.trim(),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? "Edit clinic" : "Add a clinic"}
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Clinic ID"
          description="Stable identifier used by slots, staff and lab routing."
          value={id}
          disabled={editing}
          onChange={(event) => setId(event.currentTarget.value)}
        />
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <TextInput
          label="Timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.currentTarget.value)}
        />
        {error === null ? null : (
          <Alert color="red">{errorMessage(error)}</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            disabled={name.trim().length < 2 || (!editing && id.trim() === "")}
            onClick={save}
          >
            {editing ? "Save clinic" : "Create clinic"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
