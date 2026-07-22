import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import {
  defaultLocale,
  isAppLocale,
  LOCALE_COOKIE,
} from "@/i18n/config";

/**
 * Public routes — everything else requires a signed-in Clerk session.
 * Do not gate on handshake JWT `kid` vs instance id; that caused ERR_TOO_MANY_REDIRECTS
 * when CLERK_INSTANCE_ID was stale after switching Clerk apps.
 */
const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/dev/clear-clerk(.*)",
  "/post-auth",
  "/api/health",
  "/api/webhooks(.*)",
]);

/** API auth is enforced in Route Handlers (`requireTrainerId`) so clients get JSON 401. */
const isApi = createRouteMatcher(["/api(.*)"]);

const isClearClerk = createRouteMatcher(["/dev/clear-clerk(.*)"]);

const clerk = clerkMiddleware(async (auth, req) => {
  if (isPublic(req) || isApi(req)) {
    return;
  }
  await auth.protect();
});

/** Only clear cookies for a different Clerk *instance* (JWKS kid mismatch). */
function isClerkInstanceMismatch(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("jwk-kid-mismatch") ||
    msg.includes("Unable to find a signing key in JWKS that matches the kid") ||
    msg.includes("infinite redirect loop") ||
    msg.includes("keys do not match")
  );
}

function clearClerkCookies(req: NextRequest, res: NextResponse) {
  for (const { name } of req.cookies.getAll()) {
    if (
      name.startsWith("__session") ||
      name.startsWith("__client") ||
      name.startsWith("__clerk") ||
      name.includes("clerk")
    ) {
      res.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  }
}

function recoverFromMismatch(req: NextRequest) {
  // Never bounce clear-clerk → clear-clerk (that is ERR_TOO_MANY_REDIRECTS).
  if (isClearClerk(req)) {
    const res = NextResponse.next();
    clearClerkCookies(req, res);
    return res;
  }
  const res = NextResponse.redirect(new URL("/dev/clear-clerk", req.url));
  clearClerkCookies(req, res);
  return res;
}

/**
 * Ensure NEXT_LOCALE via Set-Cookie only — never redirect for locale.
 * Skips /api/* and /dev/clear-clerk so Clerk recovery cookies stay untouched.
 */
function ensureLocaleCookie(req: NextRequest, res: NextResponse): NextResponse {
  if (isApi(req) || isClearClerk(req)) {
    return res;
  }

  const current = req.cookies.get(LOCALE_COOKIE)?.value;
  if (current && isAppLocale(current)) {
    return res;
  }

  res.cookies.set(LOCALE_COOKIE, defaultLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

function asNextResponse(res: Response): NextResponse {
  if (res instanceof NextResponse) {
    return res;
  }
  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

/**
 * Stale cookies / wrong Clerk keys can crash Edge middleware or loop handshakes.
 * Recover by clearing cookies once via /dev/clear-clerk — never re-enter that path.
 * Locale cookie is attached after Clerk (no locale redirects → no auth loops).
 */
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  let res: Response;
  try {
    const result = await Promise.resolve(clerk(req, event));
    res = result ?? NextResponse.next();
  } catch (err) {
    if (!isClerkInstanceMismatch(err)) throw err;
    res = recoverFromMismatch(req);
  }

  return ensureLocaleCookie(req, asNextResponse(res));
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
