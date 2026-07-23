import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export async function ClientLimitNotice({ limit }: { limit: number }) {
  const t = await getTranslations("clients");

  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm text-muted-foreground">
        {t("limitReached", { limit })}
      </p>
      <Link
        href="/settings/billing"
        className={buttonClassName("primary", "md", "w-full sm:w-auto")}
      >
        {t("upgradeBilling")}
      </Link>
    </Card>
  );
}
