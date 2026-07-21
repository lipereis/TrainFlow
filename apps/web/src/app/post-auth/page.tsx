import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureTrainerRole } from "@/lib/ensure-trainer";
import { roleFromClaims } from "@/lib/roles";

/** After Clerk sign-in/up — set TRAINER role if needed, then go to app. */
export default async function PostAuthPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  let role = roleFromClaims(sessionClaims as Record<string, unknown>);
  if (!role) {
    await ensureTrainerRole(userId);
    role = "TRAINER";
  }

  if (role === "CLIENT") redirect("/portal");
  redirect("/clients");
}
