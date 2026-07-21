import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** One-shot escape hatch: drop Clerk cookies then go to sign-in. */
export default async function ClearClerkPage() {
  const jar = await cookies();
  for (const c of jar.getAll()) {
    const { name } = c;
    if (
      name.startsWith("__session") ||
      name.startsWith("__client") ||
      name.startsWith("__clerk") ||
      name.includes("clerk")
    ) {
      jar.delete(name);
    }
  }
  redirect("/sign-in");
}
