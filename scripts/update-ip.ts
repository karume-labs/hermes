import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";

// Pennywise-inspired: sync LAN IPv4 into mobile .env as EXPO_PUBLIC_API_BASE.
const nets = networkInterfaces();
let lan = "";
for (const list of Object.values(nets)) {
  for (const n of list ?? []) {
    if (n.family === "IPv4" && !n.internal && n.address.startsWith("192."))
      lan = n.address;
  }
}
if (!lan) {
  for (const list of Object.values(nets)) {
    for (const n of list ?? []) {
      if (n.family === "IPv4" && !n.internal) lan = n.address;
    }
  }
}

const apiBase = `http://${lan || "localhost"}:8001`;
for (const envPath of [join("apps", "mobile", ".env")]) {
  try {
    let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
    if (content.includes("EXPO_PUBLIC_API_BASE=")) {
      content = content.replace(
        /^EXPO_PUBLIC_API_BASE=.*$/m,
        `EXPO_PUBLIC_API_BASE=${apiBase}`,
      );
    } else {
      content += `${content.endsWith("\n") || content === "" ? "" : "\n"}EXPO_PUBLIC_API_BASE=${apiBase}\n`;
    }
    writeFileSync(envPath, content);
    console.log(`Updated ${envPath}: EXPO_PUBLIC_API_BASE=${apiBase}`);
  } catch {
    // apps/mobile may not be checked out — skip silently.
  }
}
