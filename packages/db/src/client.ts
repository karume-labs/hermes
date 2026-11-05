import * as authSchema from "@db/auth/schema/index";
import * as bookingSchema from "@db/booking/schema/index";
import * as careLoopSchema from "@db/care-loop/schema/index";
import { env } from "@db/env/index";
import * as ingestionSchema from "@db/ingestion/schema/index";
import * as notifySchema from "@db/notify/schema/index";
import * as patientSchema from "@db/patient/schema/index";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const schema = {
  ...authSchema,
  ...careLoopSchema,
  ...bookingSchema,
  ...notifySchema,
  ...patientSchema,
  ...ingestionSchema,
};

// Vaunt pattern: one pooled client, no prepared statements (PgBouncer-safe).
const queryClient = postgres(env.DATABASE_URL, {
  max: 15,
  idle_timeout: 30,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
