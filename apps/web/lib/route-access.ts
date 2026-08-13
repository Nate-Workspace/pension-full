const AUTH_COOKIE_NAME = "access_token";
const LOGIN_PATH = "/auth/login";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  LOGIN_PATH,
  "/login",
  "/gallery",
  "/about",
  "/amenities",
  "/attractions",
  "/contact",
  "/faq",
  "/rooms",
  "/terms",
  "/privacy",
  "/booking/track",
]);

const PUBLIC_PREFIXES = ["/booking/"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/cms",
  "/bookings",
  "/payments",
  "/reports",
  "/settings",
];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getLoginPath(): string {
  return LOGIN_PATH;
}

export function hasAuthCookie(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue && cookieValue.trim().length > 0);
}

export { AUTH_COOKIE_NAME };
