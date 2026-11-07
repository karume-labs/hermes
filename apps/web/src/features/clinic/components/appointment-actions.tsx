"use client";

import type { ClinicAppointment } from "@hermes/types";
import { Anchor, Button, Group } from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  useCancelClinicBooking,
  useRecordBookingOutcome,
} from "@/features/clinic/services/mutations";

export const AppointmentActions = ({
  appointment,
  onReschedule,
}: {
  appointment: ClinicAppointment;
  onReschedule: (appointment: ClinicAppointment) => void;
}): ReactNode => {
  const cancel = useCancelClinicBooking();
  const outcome = useRecordBookingOutcome();
  const started = new Date(appointment.slot.startAt).getTime() <= Date.now();
  const confirmed = appointment.booking.status === "confirmed";

  return (
    <Group gap={4} wrap="nowrap">
      <Anchor
        component={Link}
        href={`/cases/${appointment.booking.caseId}`}
        size="sm"
        fw={600}
      >
        Open case
      </Anchor>
      {confirmed && !started ? (
        <>
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => onReschedule(appointment)}
          >
            Reschedule
          </Button>
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            loading={cancel.isPending}
            onClick={() => cancel.mutate(appointment.booking.id)}
          >
            Cancel
          </Button>
        </>
      ) : null}
      {confirmed && started ? (
        <>
          <Button
            size="compact-xs"
            variant="light"
            color="teal"
            loading={outcome.isPending}
            onClick={() =>
              outcome.mutate({
                bookingId: appointment.booking.id,
                status: "attended",
              })
            }
          >
            Attended
          </Button>
          <Button
            size="compact-xs"
            variant="light"
            color="red"
            loading={outcome.isPending}
            onClick={() =>
              outcome.mutate({
                bookingId: appointment.booking.id,
                status: "no_show",
              })
            }
          >
            No-show
          </Button>
        </>
      ) : null}
    </Group>
  );
};
