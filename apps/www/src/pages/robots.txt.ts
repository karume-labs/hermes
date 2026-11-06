import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/constants";

export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /sign-in",
    "Disallow: /accept-invite",
    `Sitemap: ${new URL("/sitemap.xml", SITE_URL).toString()}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
