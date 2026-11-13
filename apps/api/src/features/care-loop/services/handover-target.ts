import { user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import { eq } from "drizzle-orm";

export interface HandoverTarget {
  id: string;
  name: string;
  email: string;
  role: string;
  clinicId: string | null;
  organizationId: string | null;
  notificationChannel: "email" | "in_app" | "both";
}

export const findTarget = async (
  id: string,
): Promise<HandoverTarget | null> => {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      organizationId: user.organizationId,
      notificationChannel: user.notificationChannel,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  return row ?? null;
};

export const clinicOf = async (id: string | null): Promise<string | null> => {
  if (id === null) return null;
  const [row] = await db
    .select({ name: clinics.name })
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);
  return row === undefined ? null : row.name;
};
