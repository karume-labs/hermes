import { staffInvites } from "@db/auth/schema/index";
import { db } from "@db/client";
import { and, desc, eq, isNull } from "drizzle-orm";

export const listOrganizationInvites = (organizationId: string) =>
  db
    .select({
      id: staffInvites.id,
      email: staffInvites.email,
      name: staffInvites.name,
      role: staffInvites.role,
      clinicId: staffInvites.clinicId,
      expiresAt: staffInvites.expiresAt,
      createdAt: staffInvites.createdAt,
    })
    .from(staffInvites)
    .where(
      and(
        eq(staffInvites.organizationId, organizationId),
        isNull(staffInvites.acceptedAt),
      ),
    )
    .orderBy(desc(staffInvites.createdAt));
