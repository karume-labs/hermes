"use client";

import type { ClinicAppointment } from "@hermes/types";
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useClinicSlots } from "@/features/cases/services/queries";
import { useRescheduleClinicBooking } from "@/features/clinic/services/mutations";
import { errorMessage } from "@/features/shared/utils/form-errors";

interface RescheduleAppointmentModalProps {
  appointment: ClinicAppointment | null;
  onClose: () => void;
}

export const RescheduleAppointmentModal = ({
  appointment,
  onClose,
}: RescheduleAppointmentModalProps) => {
  const slots = useClinicSlots(appointment?.slot.clinicId ?? "");
  const reschedule = useRescheduleClinicBooking();
  const [slotId, setSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (appointment === null) setSlotId(null);
  }, [appointment]);

  const options = useMemo(
    () =>
      (slots.data ?? [])
        .filter(
          (slot) =>
            slot.kind === appointment?.slot.kind && slot.heldByCaseId === null,
        )
        .map((slot) => ({
          value: slot.id,
          label: `${dayjs(slot.startAt).format("ddd D MMM · HH:mm")} · ${
            slot.kind === "telehealth" ? "Video" : "In person"
          }`,
        })),
    [appointment?.slot.kind, slots.data],
  );

  const submit = (): void => {
    if (appointment === null || slotId === null) return;
    reschedule.mutate(
      {
        bookingId: appointment.booking.id,
        slotId,
        kind: appointment.slot.kind,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      opened={appointment !== null}
      onClose={onClose}
      title="Move this visit"
      centered
    >
      <Stack gap="md">
        {appointment === null ? null : (
          <Text size="sm" c="dimmed">
            Moving {appointment.patientName}&apos;s visit from{" "}
            {dayjs(appointment.slot.startAt).format("ddd D MMM · HH:mm")}.
          </Text>
        )}
        {reschedule.isError ? (
          <Alert color="red">{errorMessage(reschedule.error)}</Alert>
        ) : null}
        <Select
          label="New time"
          placeholder={
            slots.isLoading ? "Loading open slots…" : "Choose a time"
          }
          data={options}
          value={slotId}
          onChange={setSlotId}
          searchable
          nothingFoundMessage="No open slots of this type"
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Keep current time
          </Button>
          <Button
            loading={reschedule.isPending}
            disabled={slotId === null}
            onClick={submit}
          >
            Move visit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
