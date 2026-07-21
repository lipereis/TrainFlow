import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req) || isApi(req)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
