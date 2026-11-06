import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/constants";

const PATHS = ["/", "/privacy", "/terms"];

export const GET: APIRoute = () => {
  const urls = PATHS.map(
    (path) =>
      `<url><loc>${new URL(path, SITE_URL).toString()}</loc><changefreq>monthly</changefreq></url>`,
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
