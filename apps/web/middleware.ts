import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOGIN_PATH = "/auth/login";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  // The auth cookie is set on the API origin (e.g. localhost:5000), not the web
  // app origin (e.g. localhost:3001). Client-side auth via /auth/me handles sessions.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|logo1.png|.*\\..*).*)"],
};
