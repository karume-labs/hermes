import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  type DASHBOARD_ROLES,
  isDashboardRole,
} from "@/features/auth/services/dashboard-role";
import { env } from "@/features/shared/env/index";

const SESSION_COOKIES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
] as const;

// Every staff role reaches the dashboard; the API still decides what each may
// do. `panelRole` mirrors DASHBOARD_ROLES so a new role cannot be half-added.
type PanelRole = (typeof DASHBOARD_ROLES)[number];

// "none" is a real answer from the API. "unknown" is a probe that timed out or
// was rate limited: that says nothing about the visitor, and treating it as
// signed-out signs a working session out mid-journey.
type ProbeOutcome =
  | { kind: "session"; role: PanelRole }
  | { kind: "none" }
  | { kind: "unknown" };

// Governance pages an organization owner runs for their own org. Everything
// else under /admin stays with the platform operator.
const ORG_ADMIN_PATHS = ["/admin/staff", "/admin/organization"] as const;

const orgAdminMayOpen = (pathname: string): boolean =>
  ORG_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const sessionCookie = (request: NextRequest): string | null => {
  for (const name of SESSION_COOKIES) {
    const value = request.cookies.get(name)?.value;
    if (value !== undefined) return `${name}=${value}`;
  }
  return null;
};

const readSession = async (request: NextRequest): Promise<ProbeOutcome> => {
  const cookie = sessionCookie(request);
  if (cookie === null) return { kind: "none" };
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/auth/get-session`,
      {
        headers: { cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(4_000),
      },
    );
    if (!response.ok) {
      const declined = response.status === 401 || response.status === 403;
      return declined ? { kind: "none" } : { kind: "unknown" };
    }
    const body: unknown = await response.json();
    if (body === null || typeof body !== "object" || !("user" in body)) {
      return { kind: "none" };
    }
    const { user } = body;
    if (user === null || typeof user !== "object" || !("role" in user)) {
      return { kind: "none" };
    }
    if (!isDashboardRole(user.role)) return { kind: "none" };
    return { kind: "session", role: user.role };
  } catch {
    return { kind: "unknown" };
  }
};

const probeRole = (probe: ProbeOutcome): PanelRole | null =>
  probe.kind === "session" ? probe.role : null;

const isAssetPath = (pathname: string): boolean =>
  pathname.startsWith("/_next") ||
  pathname.startsWith("/images") ||
  pathname === "/favicon.ico";

const AUTH_PATHS = ["/sign-in", "/accept-invite", "/reset-password"];

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (isAssetPath(pathname)) return NextResponse.next();

  const isAuthPage = AUTH_PATHS.includes(pathname);
  const probe = await readSession(request);
  // The API still authorizes every request, so a visitor whose probe timed out
  // is let through to a page that can explain itself rather than to a sign-in
  // redirect that would drop a live cookie.
  if (probe.kind === "unknown") return NextResponse.next();
  const role = probeRole(probe);

  if (role === null) {
    if (isAuthPage) return NextResponse.next();
    const signIn = new URL("/sign-in", request.url);
    if (pathname !== "/") signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  if (isAuthPage) return NextResponse.redirect(new URL("/queue", request.url));

  // Governance pages are admin-only, except the two an organization owner
  // runs for their own organization.
  if (
    pathname.startsWith("/admin") &&
    role !== "admin" &&
    !(role === "org_admin" && orgAdminMayOpen(pathname))
  ) {
    return NextResponse.redirect(new URL("/queue", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|icon.png|apple-icon.png).*)",
  ],
};
