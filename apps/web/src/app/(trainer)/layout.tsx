import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { roleFromClaims } from "@/lib/roles";
import { ensureTrainerRole } from "@/lib/ensure-trainer";
import { AppearanceControls } from "@/components/appearance-controls";
import { TrainerSidebar } from "@/components/trainer-sidebar";

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

  return (
    <div className="flex min-h-screen">
      <TrainerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <AppearanceControls />
          <UserButton />
        </header>
        <main className="mx-auto w-full max-w-[90rem] flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
