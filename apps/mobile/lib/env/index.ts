// process.env is confined here; everything else imports the resolved `env`.
// EXPO_PUBLIC_* values are inlined at build time, so a release build without
// them would otherwise ship an app pointed at localhost.

const isDevelopment = process.env.NODE_ENV !== "production";

const requireValue = (name: string, value: string | undefined): string => {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === "") {
    throw new Error(
      `Missing ${name}. Set it in apps/mobile/.env before building.`,
    );
  }
  return trimmed;
};

const resolveApiBase = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_BASE;
  if (isDevelopment) {
    const devBase = configured?.trim();
    if (devBase === undefined || devBase === "") {
      return "http://localhost:8001";
    }
    return devBase;
  }
  const base = requireValue("EXPO_PUBLIC_API_BASE", configured);
  if (!base.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_BASE must be an https URL in production.");
  }
  return base;
};

const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();

export const env = {
  apiBase: resolveApiBase(),
  easProjectId:
    easProjectId === undefined || easProjectId === ""
      ? undefined
      : easProjectId,
};
