import type { authClient } from "@/features/auth/services/client";

type SessionState = ReturnType<typeof authClient.useSession>;

/** User as Better Auth exposes it on the client (includes the staff role). */
export type SessionUser = NonNullable<SessionState["data"]>["user"];
