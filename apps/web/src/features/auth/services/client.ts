import type { auth } from "@api/features/auth/services/config";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/features/shared/env/index";

// Same client as the API instance: `inferAdditionalFields` carries `role` so
// the dashboard sees the staff role without redeclaring it.
export const authClient = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/auth`,
  plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});
