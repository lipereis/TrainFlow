import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { AppearanceControls } from "@/components/appearance-controls";
import { BrandLogo } from "@/components/brand-logo";
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-md sm:h-16 sm:gap-3 sm:px-6 sm:py-3">
        <span className="sm:hidden">
          <BrandLogo href="/portal" size="xs" />
        </span>
        <span className="hidden sm:inline-flex">
          <BrandLogo href="/portal" size="nav" />
        </span>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <AppearanceControls />
          <UserButton />
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
