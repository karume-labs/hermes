import { readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";

/**
 * Finds the machine's primary local IPv4 address.
 * Prioritizes active Wi-Fi and Ethernet interfaces.
 */
export const getLocalIpAddress = (): string | null => {
  const nets = networkInterfaces();
  const candidates: { name: string; ip: string }[] = [];

  for (const [name, interfaces] of Object.entries(nets)) {
    if (!interfaces) continue;
    for (const net of interfaces) {
      const isIpv4 = net.family === "IPv4" || (net.family as unknown) === 4;
      if (isIpv4 && !net.internal) {
        candidates.push({ name, ip: net.address });
      }
    }
  }

  // Prioritize common Wi-Fi (wl*, wlan*) and Ethernet (en*, eth*) interfaces.
  const preferred = candidates.find(
    (c) =>
      c.name.startsWith("wl") ||
      c.name.startsWith("en") ||
      c.name.startsWith("eth"),
  );

  return preferred?.ip ?? candidates[0]?.ip ?? null;
};

/**
 * Synchronizes apps/mobile/.env with the host's current local IP address
 * so connected devices and emulators can reach the development server.
 */
export const updateMobileEnvIp = (port = 8001): void => {
  const ip = getLocalIpAddress();
  if (!ip) {
    console.warn("[update-ip] Could not determine a local IPv4 address.");
    return;
  }

  const envPath = resolve(import.meta.dirname, "../apps/mobile/.env");
  const targetOrigin = `http://${ip}:${port}`;
  const envKey = "EXPO_PUBLIC_API_BASE";

  let content = "";
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    // If .env doesn't exist yet, we'll create it below.
  }

  const regex = new RegExp(`^${envKey}=.*$`, "m");
  const newLine = `${envKey}=${targetOrigin}`;

  let updated: string;
  if (regex.test(content)) {
    if (content.includes(newLine)) {
      console.log(
        `[update-ip] ${envKey} is already up to date: ${targetOrigin}`,
      );
      return;
    }
    updated = content.replace(regex, newLine);
  } else {
    updated = content ? `${content.trimEnd()}\n${newLine}\n` : `${newLine}\n`;
  }

  writeFileSync(envPath, updated, "utf8");
  console.log(`[update-ip] Updated ${envKey} to ${targetOrigin}`);
};

if (import.meta.main) {
  // Caddy exposes the API at 8001 inside infra/docker; override when running
  // the API directly, e.g. `API_PORT=18003 bun run update-ip`.
  updateMobileEnvIp(Number(process.env.API_PORT ?? 8001));
}
