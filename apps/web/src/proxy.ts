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

type SessionProbe = {
  role: PanelRole;
};

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

const readSession = async (
  request: NextRequest,
): Promise<SessionProbe | null> => {
  const cookie = sessionCookie(request);
  if (cookie === null) return null;
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/auth/get-session`,
      {
        headers: { cookie },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (body === null || typeof body !== "object" || !("user" in body)) {
      return null;
    }
    const { user } = body;
    if (user === null || typeof user !== "object" || !("role" in user)) {
      return null;
    }
    if (!isDashboardRole(user.role)) return null;
    return { role: user.role };
  } catch {
    return null;
  }
};

const isAssetPath = (pathname: string): boolean =>
  pathname.startsWith("/_next") ||
  pathname.startsWith("/images") ||
  pathname === "/favicon.ico";

const AUTH_PATHS = [
  "/sign-in",
  "/accept-invite",
  "/reset-password",
  "/email-preferences",
];

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (isAssetPath(pathname)) return NextResponse.next();

  const isAuthPage = AUTH_PATHS.includes(pathname);
  const session = await readSession(request);

  if (session === null) {
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
    session.role !== "admin" &&
    !(session.role === "org_admin" && orgAdminMayOpen(pathname))
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
