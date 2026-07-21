import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { roleFromClaims } from "@/lib/roles";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");
  const role = roleFromClaims(session.sessionClaims as Record<string, unknown>);
  if (role !== "CLIENT") {
    if (role === "TRAINER") redirect("/clients");
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <span className="font-semibold tracking-tight">TrainFlow</span>
        <UserButton />
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
