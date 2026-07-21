import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** GET /dev/clear-clerk — drop Clerk cookies, then redirect to sign-in. */
export async function GET(request: Request) {
  const jar = await cookies();
  const res = NextResponse.redirect(new URL("/sign-in", request.url));

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
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        domain: "localhost",
      });
    }
  }

  return res;
}
