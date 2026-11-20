"use client";

import type { StaffRole } from "@hermes/types";
import { Group, Select } from "@mantine/core";
import type { ReactNode } from "react";
import {
  CLINICAL_ROLES,
  PLATFORM_ROLES,
} from "@/features/admin/components/staff-role-options";

interface Option {
  value: string;
  label: string;
}

interface StaffInviteTargetProps {
  isPlatformAdmin: boolean;
  role: StaffRole;
  onRoleChange: (role: StaffRole) => void;
  needsClinic: boolean;
  clinicOptions: Option[];
  clinicId: string | null;
  onClinicChange: (clinicId: string | null) => void;
  organizationOptions: Option[];
  organizationId: string | null;
  onOrganizationChange: (organizationId: string | null) => void;
}

export const StaffInviteTarget = ({
  isPlatformAdmin,
  role,
  onRoleChange,
  needsClinic,
  clinicOptions,
  clinicId,
  onClinicChange,
  organizationOptions,
  organizationId,
  onOrganizationChange,
}: StaffInviteTargetProps): ReactNode => (
  <Group align="flex-end" grow>
    <Select
      label="Role"
      data={isPlatformAdmin ? PLATFORM_ROLES : CLINICAL_ROLES}
      value={role}
      onChange={(value) =>
        onRoleChange(
          value === "clinician" || value === "org_admin" || value === "admin"
            ? value
            : "coordinator",
        )
      }
      allowDeselect={false}
    />
    {needsClinic ? (
      <Select
        label="Clinic"
        description="Coordinators and clinicians must be assigned to one clinic."
        data={clinicOptions}
        value={clinicId}
        onChange={onClinicChange}
        clearable
        searchable
      />
    ) : isPlatformAdmin ? (
      <Select
        label="Organization"
        description="The organization this admin will run."
        data={organizationOptions}
        value={organizationId}
        onChange={onOrganizationChange}
        searchable
      />
    ) : null}
  </Group>
);
