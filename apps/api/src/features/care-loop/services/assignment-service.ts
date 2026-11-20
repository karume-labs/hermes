import {
  findCase,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import { type StaffContext, staffScope } from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { CaseAssignee, StaffRole } from "@hermes/types";
import { and, asc, eq, inArray } from "drizzle-orm";

type TeamRow = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  clinicId: string | null;
  clinicName: string | null;
};

const toTeamMember = (row: TeamRow) => ({
  ...row,
  clinicName: row.clinicName,
});

export const listTeam = async (staff: StaffContext): Promise<TeamRow[]> => {
  const predicates = [
    inArray(user.role, ["coordinator", "clinician", "admin"]),
    eq(user.banned, false),
  ];
  if (staff.role !== "admin" && staff.clinicId !== null) {
    predicates.push(eq(user.clinicId, staff.clinicId));
  }
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: clinics.name,
    })
    .from(user)
    .leftJoin(clinics, eq(user.clinicId, clinics.id))
    .where(and(...predicates))
    .orderBy(asc(user.name));
  return rows.map(toTeamMember);
};

const findAssignee = async (id: string) => {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: clinics.name,
    })
    .from(user)
    .leftJoin(clinics, eq(user.clinicId, clinics.id))
    .where(and(eq(user.id, id), eq(user.banned, false)))
    .limit(1);
  return row;
};

export const assignCase = async (
  staff: StaffContext,
  caseId: string,
  assignedToId: string | null,
) => {
  // The queue shows hand-over cases from other clinics too, so the read uses
  // the same scope the list used: a hand-over case is found, and the assignee
  // check below is what refuses an owner from the wrong clinic.
  const found = await findCase(caseId, staffScope(staff));
  if (found === null) throw new NotFoundError("Case not found");

  if (assignedToId !== null) {
    const assignee = await findAssignee(assignedToId);
    if (assignee === null) throw new NotFoundError("Staff member not found");
    const allowedClinics = [found.clinicId, found.referralClinicId].filter(
      (clinicId): clinicId is string => clinicId !== null,
    );
    if (
      assignee.clinicId === null ||
      !allowedClinics.includes(assignee.clinicId)
    ) {
      throw new ConflictError("Choose a staff member from this care team");
    }
    if (assignee.role === "admin") {
      throw new ConflictError("Choose a clinical or coordination owner");
    }
  }

  return updateCase(found.id, { assignedToId });
};

// Every new case starts with a named owner. Coordinators are preferred because
// they run outreach, then clinicians; admins are never a case owner.
const findDefaultAssignee = async (
  clinicId: string,
): Promise<string | null> => {
  const rows = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(
      and(
        eq(user.clinicId, clinicId),
        eq(user.banned, false),
        inArray(user.role, ["coordinator", "clinician"]),
      ),
    )
    .orderBy(asc(user.createdAt), asc(user.id));
  const preferred = rows.find((row) => row.role === "coordinator") ?? rows[0];
  return preferred?.id;
};

export const defaultAssigneeId = async (
  clinicId: string,
): Promise<string | null> => findDefaultAssignee(clinicId);

export const teamMember = async (id: string): Promise<CaseAssignee | null> => {
  const row = await findAssignee(id);
  return row === null ? null : toTeamMember(row);
};
