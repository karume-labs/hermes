import type { StaffContext } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { eq } from "drizzle-orm";

// How a staff member wants their own alerts. Not an access change, so it does
// not invalidate the session.
export const readNotificationChannel = async (
  staff: StaffContext,
): Promise<{ channel: "email" | "in_app" | "both" }> => {
  const [row] = await db
    .select({ channel: user.notificationChannel })
    .from(user)
    .where(eq(user.id, staff.id))
    .limit(1);
  if (row === undefined) throw new NotFoundError("Staff member not found");
  return row;
};

export const updateNotificationChannel = async (
  staff: StaffContext,
  channel: "email" | "in_app" | "both",
): Promise<{ channel: "email" | "in_app" | "both" }> => {
  const [row] = await db
    .update(user)
    .set({ notificationChannel: channel })
    .where(eq(user.id, staff.id))
    .returning({ channel: user.notificationChannel });
  if (row === undefined) throw new NotFoundError("Staff member not found");
  return row;
};
