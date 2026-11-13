import { env } from "@api/features/shared/env/index";

export const appUrl = (path: string): string =>
  `${env.FRONTEND_URL.replace(/\/$/, "")}${path}`;
