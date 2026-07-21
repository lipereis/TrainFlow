import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { roleFromClaims } from "@/lib/roles";
import { ensureTrainerRole } from "@/lib/ensure-trainer";

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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <Link href="/clients" className="font-semibold tracking-tight">
          TrainFlow
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/clients">Clients</Link>
          <Link href="/clients/invite">Invite</Link>
          <UserButton />
        </nav>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
