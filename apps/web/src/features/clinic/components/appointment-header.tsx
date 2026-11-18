"use client";

import { Alert } from "@mantine/core";
import { IconCalendarEvent } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/features/shared/components/layout/page-header";

interface AppointmentHeaderProps {
  isError: boolean;
}

export const AppointmentHeader = ({
  isError,
}: AppointmentHeaderProps): ReactNode => (
  <>
    <PageHeader
      eyebrow="Care team"
      title="Appointments"
      subtitle="Every booked, attended and cancelled visit, with the result behind it."
      icon={<IconCalendarEvent size={24} />}
    />
    {isError ? (
      <Alert color="red" title="The schedule could not load">
        The dashboard could not reach the care API, or your account is not
        attached to a clinic yet.
      </Alert>
    ) : null}
  </>
);
