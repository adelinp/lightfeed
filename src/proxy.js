import { NextResponse } from "next/server";

const ADMIN_HEADER_NAME = "x-lightfeed-admin-secret";
const ADMIN_SECRET = String(process.env.ADMIN_SECRET ?? "").trim();

function isProtectedPath(pathname) {
  return (
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/api/preview-feed" ||
    pathname === "/api/feeds" ||
    pathname.startsWith("/api/feeds/")
  );
}

function isLocalhost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function proxy(request) {
  const { pathname, hostname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (isLocalhost(hostname)) {
    return NextResponse.next();
  }

  if (!ADMIN_SECRET) {
    return new NextResponse("Admin protection is not configured.", {
      status: 503,
    });
  }

  const providedSecret = String(
    request.headers.get(ADMIN_HEADER_NAME) ?? "",
  ).trim();

  if (providedSecret !== ADMIN_SECRET) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*", "/api/feeds/:path*", "/api/preview-feed"],
};