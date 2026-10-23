import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OLD_HOST = "travelguide.dirt-trails.com";
const NEW_HOST = "trip-insights.com";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Redirect old host to new host
  if (host === OLD_HOST || host === `www.${OLD_HOST}`) {
    const newUrl = new URL(url.pathname + url.search, `https://${NEW_HOST}`);
    return NextResponse.redirect(newUrl, 301);
  }

  // Redirect www to non-www for new domain
  if (host === `www.${NEW_HOST}`) {
    const newUrl = new URL(url.pathname + url.search, `https://${NEW_HOST}`);
    return NextResponse.redirect(newUrl, 301);
  }

  // HTTP to HTTPS (when not on localhost)
  if (url.protocol === "http:" && !url.hostname.includes("localhost")) {
    const newUrl = new URL(url.pathname + url.search, `https://${host}`);
    return NextResponse.redirect(newUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json (static assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)",
  ],
};
