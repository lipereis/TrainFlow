import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { roleFromClaims } from "@/lib/roles";
import { AuthControls } from "@/components/auth-controls";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (userId) {
    const role = roleFromClaims(sessionClaims as Record<string, unknown>);
    // Always go through post-auth so role bootstrap runs
    if (!role) redirect("/post-auth");
    if (role === "CLIENT") redirect("/portal");
    redirect("/dashboard");
  }

  const t = await getTranslations("auth");
  const tNav = await getTranslations("nav");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {tNav("brand")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("tagline")}</p>
      <AuthControls />
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {t("stuckAfterLogin")}{" "}
        <Link className="underline" href="/dev/clear-clerk">
          {t("clearSession")}
        </Link>
      </p>
    </main>
  );
}
