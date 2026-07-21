import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

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
    msg.includes("Unable to find a signing key in JWKS that matches the kid")
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

/**
 * Stale cookies from a previous Clerk instance can crash Edge middleware.
 * Only recover from JWKS kid mismatch — do not intercept normal handshake
 * flows (e.g. development `dev-browser-missing`), or we cause redirect loops.
 */
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  try {
    const result = clerk(req, event);
    if (result instanceof Promise) {
      return result.catch((err: unknown) => {
        if (!isClerkInstanceMismatch(err)) throw err;
        const res = NextResponse.redirect(new URL("/dev/clear-clerk", req.url));
        clearClerkCookies(req, res);
        return res;
      });
    }
    return result;
  } catch (err) {
    if (!isClerkInstanceMismatch(err)) throw err;
    const res = NextResponse.redirect(new URL("/dev/clear-clerk", req.url));
    clearClerkCookies(req, res);
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
