import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { roleFromClaims } from "@/lib/roles";
import { AuthControls } from "@/components/auth-controls";
import { BrandLogo } from "@/components/brand-logo";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6">
      <div className="flex flex-col items-start gap-4">
        <BrandLogo href="/" size="lg" priority />
        <p className="text-zinc-600 dark:text-zinc-400">{t("tagline")}</p>
      </div>
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
