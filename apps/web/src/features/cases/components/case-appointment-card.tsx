"use client";

import type { CaseDetail, Slot } from "@hermes/types";
import { Alert, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useBookSlot } from "@/features/cases/services/mutations-case";
import { useClinicSlots } from "@/features/cases/services/queries";
import { errorMessage } from "@/features/shared/utils/form-errors";

const slotLabel = (slot: Slot): string => {
  const when = new Date(slot.startAt).toLocaleString();
  return `${when} · ${slot.kind}`;
};

export const CaseAppointmentCard = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const bookingClinicId =
    detail.referralClinicId === null
      ? detail.clinicId
      : detail.referralClinicId;
  const slots = useClinicSlots(bookingClinicId);
  const book = useBookSlot();
  const closed = detail.status === "closed";
  const bookedSlotId =
    detail.appointment === null ? null : detail.appointment.slotId;
  const availableSlots = slots.data === undefined ? [] : slots.data;

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="sm">
        <Title order={3}>Appointment</Title>
        <Text size="sm" c="dimmed">
          {detail.appointment === null
            ? "No booking yet"
            : `Booked · ${detail.appointment.status}`}
        </Text>
      </Group>
      {detail.appointment !== null ? (
        <Text size="sm" mb="sm">
          {detail.appointment.prepInstructions}
        </Text>
      ) : null}
      {book.isError ? (
        <Alert color="red" mb="sm">
          {errorMessage(book.error)}
        </Alert>
      ) : null}
      <Stack gap={6}>
        {availableSlots.map((slot) => (
          <Group key={slot.id} justify="space-between">
            <Text size="sm">{slotLabel(slot)}</Text>
            <Button
              size="xs"
              variant={bookedSlotId === slot.id ? "filled" : "light"}
              disabled={
                closed ||
                bookedSlotId !== null ||
                (slot.heldByCaseId !== null && slot.heldByCaseId !== detail.id)
              }
              loading={book.isPending}
              onClick={() =>
                book.mutate({
                  slotId: slot.id,
                  kind: slot.kind,
                  caseId: detail.id,
                })
              }
            >
              {bookedSlotId === slot.id ? "Booked" : "Book"}
            </Button>
          </Group>
        ))}
        {slots.data !== undefined && availableSlots.length === 0 ? (
          <Text size="sm" c="dimmed">
            No open slots at {bookingClinicId}.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
};
