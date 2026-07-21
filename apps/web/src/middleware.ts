import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

/** Linked Clerk app instance (TrainFlow). */
const EXPECTED_INSTANCE_ID =
  process.env.CLERK_INSTANCE_ID ?? "ins_3GobP9br2JvquBgzekos1eZFuAc";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/dev/clear-clerk",
  "/post-auth",
]);

function decodeJwtHeaderKid(token: string): string | null {
  try {
    const headerPart = token.split(".")[0];
    if (!headerPart) return null;
    const padded = headerPart + "=".repeat((4 - (headerPart.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const header = JSON.parse(json) as { kid?: string };
    return header.kid ?? null;
  } catch {
    return null;
  }
}

function expireCookie(res: NextResponse, name: string) {
  // Must append BOTH variants — res.cookies.set overwrites same name
  res.headers.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
  res.headers.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=localhost`,
  );
}

function clearClerkCookies(req: NextRequest, res: NextResponse) {
  const names = new Set<string>([
    "__session",
    "__client",
    "__client_uat",
    "__clerk_db_jwt",
  ]);
  for (const cookie of req.cookies.getAll()) {
    const { name } = cookie;
    if (
      name.startsWith("__session") ||
      name.startsWith("__client") ||
      name.startsWith("__clerk") ||
      name.includes("clerk")
    ) {
      names.add(name);
    }
  }
  for (const name of names) expireCookie(res, name);
  return res;
}

function stripHandshake(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.searchParams.delete("__clerk_handshake");
  url.searchParams.delete("__clerk_synced");
  return url;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/dev/clear-clerk") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return clearClerkCookies(req, NextResponse.redirect(url));
  }

  if (!isPublic(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const handshake = req.nextUrl.searchParams.get("__clerk_handshake");
  if (handshake) {
    const kid = decodeJwtHeaderKid(handshake);
    if (kid && kid !== EXPECTED_INSTANCE_ID) {
      const url = stripHandshake(req);
      if (url.pathname !== "/sign-up" && url.pathname !== "/sign-in") {
        url.pathname = "/sign-in";
        url.search = "";
      }
      return clearClerkCookies(req, NextResponse.redirect(url));
    }
  }

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
