import { seedAuth } from "@db/auth/seed/index";
import { seedBooking } from "@db/booking/seed/index";
import { seedCareLoop } from "@db/care-loop/seed/index";
import { seedDirectory } from "@db/directory/seed/index";
import { seedDocuments } from "@db/documents/seed/index";
import { seedRouting } from "@db/ingestion/seed/index";
import { seedNotify } from "@db/notify/seed/index";
import { seedPatient } from "@db/patient/seed/index";
import data from "@db/seed/data.json";
import { resetSeedData } from "@db/seed/reset";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const features = [
  "directory",
  "care-loop",
  "documents",
  "booking",
  "notify",
  "patient",
  "routing",
  "auth",
] as const;
type FeatureName = (typeof features)[number];
type Seeder = (context: SeedContext) => Promise<number>;

// Order matters: children (notifications, messages) read the seeded cases.
const seeders: Record<FeatureName, Seeder> = {
  directory: seedDirectory,
  "care-loop": seedCareLoop,
  documents: seedDocuments,
  booking: seedBooking,
  notify: seedNotify,
  patient: seedPatient,
  routing: seedRouting,
  auth: seedAuth,
};

const toFeature = (value: string): FeatureName | null => {
  switch (value) {
    case "directory":
      return "directory";
    case "care-loop":
      return "care-loop";
    case "documents":
      return "documents";
    case "booking":
      return "booking";
    case "notify":
      return "notify";
    case "patient":
      return "patient";
    case "routing":
      return "routing";
    case "auth":
      return "auth";
    default:
      return null;
  }
};

const isFeature = (value: FeatureName | null): value is FeatureName =>
  value !== null;

const parseArgs = (argv: string[]): FeatureName[] => {
  const flags = argv
    .filter((arg) => arg.startsWith("--") && arg !== "--force")
    .map((arg) => arg.slice(2));
  const parsed = flags.map(toFeature);
  const unknown = flags.filter((_, index) => !isFeature(parsed[index]));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown seed flag(s): ${unknown.join(", ")}. Use --directory, --care-loop, --documents, --booking, --notify, --patient, --routing, --auth or --force.`,
    );
  }
  const selected = parsed.filter(isFeature);
  return selected.length > 0 ? selected : [...features];
};

const Clinics = Type.Array(
  Type.Object({ id: Type.String(), name: Type.String() }),
);

export const seed = async (
  argv: string[] = process.argv.slice(2),
): Promise<void> => {
  const selected = parseArgs(argv);

  if (argv.includes("--force")) {
    await resetSeedData();
    console.log("Reset seeded data (--force).");
  }

  const context: SeedContext = {
    clinics: Value.Parse(Clinics, data.clinics),
    now: new Date(),
  };

  for (const feature of selected) {
    const inserted = await seeders[feature](context);
    const label =
      inserted === 0 ? "skipped, already populated" : `${inserted} rows`;
    console.log(`Seed ${feature}: ${label}.`);
  }
};

const isMain = import.meta.main;
if (isMain) await seed();
