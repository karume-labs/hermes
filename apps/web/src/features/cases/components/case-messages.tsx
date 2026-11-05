"use client";

import type { CaseDetail } from "@hermes/types";
import { type SendMessageForm, sendMessageForm } from "@hermes/validators";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  useOutreach,
  useSendMessage,
} from "@/features/cases/services/mutations";
import {
  errorMessage,
  friendlyTypeboxResolver,
} from "@/features/shared/utils/form-errors";

const OUTREACH_FALLBACK =
  "We noticed you have not reviewed your screening result. Your care coordinator is here to help — reply or call your clinic.";

export const CaseMessages = ({ detail }: { detail: CaseDetail }): ReactNode => {
  const send = useSendMessage();
  const outreach = useOutreach();
  const closed = detail.status === "closed";
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<SendMessageForm>({
    resolver: friendlyTypeboxResolver(sendMessageForm),
    defaultValues: { body: "" },
  });

  const onSubmit = (values: SendMessageForm) =>
    send.mutate(
      { caseId: detail.id, body: values.body },
      { onSuccess: () => reset({ body: "" }) },
    );

  const triggerOutreach = () => {
    const draft = getValues("body").trim();
    const body = draft === "" ? OUTREACH_FALLBACK : draft;
    outreach.mutate(
      { caseId: detail.id, body },
      { onSuccess: () => reset({ body: "" }) },
    );
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Secure messages</Text>
        <Badge variant="light">{detail.messages.length}</Badge>
      </Group>

      <ScrollArea h={280} type="auto">
        <Stack gap="xs">
          {detail.messages.length === 0 ? (
            <Text size="sm" c="dimmed">
              No messages yet. Send a secure note or trigger outreach on both
              push and SMS.
            </Text>
          ) : null}
          {detail.messages.map((message) => {
            const fromPatient = message.sender === "patient";
            return (
              <Card
                key={message.id}
                withBorder
                bg={fromPatient ? "brandChalk.2" : "brandSky.0"}
                p="xs"
              >
                <Group justify="space-between">
                  <Text size="xs" fw={600}>
                    {fromPatient ? "Patient" : "Care team"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(message.createdAt).toLocaleString()}
                  </Text>
                </Group>
                <Text size="sm">{message.body}</Text>
                <Text size="xs" c="dimmed">
                  {message.readAt === null ? "unread" : "read"}
                </Text>
              </Card>
            );
          })}
        </Stack>
      </ScrollArea>

      {send.isError || outreach.isError ? (
        <Alert color="red" mt="sm">
          {errorMessage(send.isError ? send.error : outreach.error)}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="sm" mt="sm">
          <Textarea
            label="Message to patient"
            placeholder="Your HbA1c result needs a follow-up visit. We can book it for you."
            minRows={2}
            error={errors.body?.message}
            disabled={closed}
            {...register("body")}
          />
          <Group>
            <Button type="submit" loading={send.isPending} disabled={closed}>
              Send secure message
            </Button>
            <Button
              type="button"
              variant="light"
              color="orange"
              disabled={closed}
              loading={outreach.isPending}
              onClick={triggerOutreach}
            >
              Trigger push + SMS outreach
            </Button>
          </Group>
        </Stack>
      </form>
      <Text size="xs" c="dimmed" mt={6}>
        Outreach stores the message and queues an SMS fallback for patients who
        have not acknowledged their result.
      </Text>
    </Card>
  );
};
