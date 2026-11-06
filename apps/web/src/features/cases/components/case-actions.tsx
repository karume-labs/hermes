"use client";

import type { CaseDetail, Slot } from "@hermes/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { CaseAssignment } from "@/features/cases/components/case-assignment";
import { CaseMilestones } from "@/features/cases/components/case-milestones";
import { CaseReferrals } from "@/features/cases/components/case-referrals";
import { CaseCloseForm } from "@/features/cases/components/close-case-form";
import { CaseReferralForm } from "@/features/cases/components/referral-form";
import {
  useBookSlot,
  useCompleteTask,
} from "@/features/cases/services/mutations";
import { useClinicSlots } from "@/features/cases/services/queries";
import { errorMessage } from "@/features/shared/utils/form-errors";

const slotLabel = (slot: Slot): string => {
  const start = new Date(slot.startAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const kind = slot.kind === "telehealth" ? "Telehealth" : "In person";
  return `${start} · ${kind}`;
};

export const CaseActions = ({ detail }: { detail: CaseDetail }): ReactNode => {
  const bookingClinicId =
    detail.referralClinicId === null
      ? detail.clinicId
      : detail.referralClinicId;
  const slots = useClinicSlots(bookingClinicId);
  const book = useBookSlot();
  const completeTask = useCompleteTask();
  const closed = detail.status === "closed";
  const bookedSlotId =
    detail.appointment === null ? null : detail.appointment.slotId;
  const availableSlots = slots.data === undefined ? [] : slots.data;

  return (
    <Stack gap="lg">
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
                  (slot.heldByCaseId !== null &&
                    slot.heldByCaseId !== detail.id)
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

      <CaseAssignment detail={detail} />

      <CaseMilestones detail={detail} />

      <Card withBorder radius="md" p="lg">
        <Title order={3}>Referral hand-off</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Link the downstream provider so the shared record follows the patient.
        </Text>
        <CaseReferralForm
          caseId={detail.id}
          currentClinicId={detail.referralClinicId}
          originClinicId={detail.clinicId}
          disabled={closed}
        />
      </Card>

      <CaseReferrals detail={detail} />

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="sm">
          <Title order={3}>Open work</Title>
          <Badge variant="light">{detail.tasks.length}</Badge>
        </Group>
        <Stack gap="sm">
          {detail.tasks.map((task) => (
            <Group key={task.id} justify="space-between" align="flex-start">
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {task.title}
                </Text>
                <Text size="xs" c="dimmed">
                  {task.kind} · {task.detail ?? "No detail"}
                </Text>
              </Stack>
              <Button
                size="xs"
                variant="light"
                loading={completeTask.isPending}
                onClick={() => completeTask.mutate(task.id)}
              >
                Done
              </Button>
            </Group>
          ))}
          {detail.tasks.length === 0 ? (
            <Text size="sm" c="dimmed">
              No open escalation or referral tasks.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Title order={3}>Documented closure</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Clinical sign-off needs evidence and a follow-up plan.
        </Text>
        {closed ? (
          <Alert color="teal" mb="sm" title="Closed">
            {detail.closureEvidence} · Plan: {detail.closurePlan} · Signed by{" "}
            {detail.closedBy}
          </Alert>
        ) : null}
        <CaseCloseForm caseId={detail.id} disabled={closed} />
      </Card>
    </Stack>
  );
};
