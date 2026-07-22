import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { roleFromClaims } from "@/lib/roles";
import { MarketingPage } from "@/components/marketing/marketing-page";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (userId) {
    const role = roleFromClaims(sessionClaims as Record<string, unknown>);
    // Always go through post-auth so role bootstrap runs
    if (!role) redirect("/post-auth");
    if (role === "CLIENT") redirect("/portal");
    redirect("/dashboard");
  }

  return <MarketingPage />;
}
