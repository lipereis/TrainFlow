import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { roleFromClaims } from "@/lib/roles";
import { ensureTrainerRole } from "@/lib/ensure-trainer";
import { TrainerShell } from "@/components/trainer-shell";

export const dynamic = "force-dynamic";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  let role = roleFromClaims(session.sessionClaims as Record<string, unknown>);
  if (!role) {
    await ensureTrainerRole(session.userId);
    role = "TRAINER";
  }
  if (role === "CLIENT") redirect("/portal");
  if (role !== "TRAINER") redirect("/sign-in");

  return <TrainerShell>{children}</TrainerShell>;
}
