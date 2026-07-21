import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { roleFromClaims } from "@/lib/roles";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (userId) {
    const role = roleFromClaims(sessionClaims as Record<string, unknown>);
    // Always go through post-auth so role bootstrap runs
    if (!role) redirect("/post-auth");
    if (role === "CLIENT") redirect("/portal");
    redirect("/dashboard");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold tracking-tight">TrainFlow</h1>
      <p className="text-zinc-600">AI-powered OS for personal trainers.</p>
      <div className="flex gap-3">
        <Link className="rounded bg-zinc-900 px-4 py-2 text-white" href="/sign-in">
          Sign in
        </Link>
        <Link className="rounded border border-zinc-300 px-4 py-2" href="/sign-up">
          Sign up as trainer
        </Link>
      </div>
      <p className="text-xs text-zinc-400">
        Stuck after login?{" "}
        <Link className="underline" href="/dev/clear-clerk">
          Clear session
        </Link>
      </p>
    </main>
  );
}
