import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** GET /dev/clear-clerk — drop Clerk cookies, then go home (not sign-in). */
export async function GET(request: Request) {
  const jar = await cookies();
  // Land on `/` so Clerk does not immediately try a session refresh on /sign-in.
  const res = NextResponse.redirect(new URL("/", request.url));
  res.headers.set("Clear-Site-Data", '"cookies"');

  for (const c of jar.getAll()) {
    const { name } = c;
    if (
      name.startsWith("__session") ||
      name.startsWith("__client") ||
      name.startsWith("__clerk") ||
      name.includes("clerk")
    ) {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  return res;
}
