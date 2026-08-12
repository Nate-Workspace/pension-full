import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  getLoginPath,
  hasAuthCookie,
  isProtectedPath,
  isPublicPath,
} from "@/lib/route-access";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!hasAuthCookie(token)) {
      const loginUrl = new URL(getLoginPath(), request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|logo1.png|.*\\..*).*)"],
};
