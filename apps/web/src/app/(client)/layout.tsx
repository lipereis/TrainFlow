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
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur-md">
        <BrandLogo href="/portal" size="nav" />
        <div className="flex items-center gap-3">
          <AppearanceControls />
          <UserButton />
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
