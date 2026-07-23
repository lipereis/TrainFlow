import { getTranslations } from "next-intl/server";
import type { TrainerPlanStatus } from "@trainflow/db";
import { BillingActions } from "@/components/billing-actions";
import { Card } from "@/components/ui/card";
import { requireTrainerId } from "@/server/auth";
import { getBillingSummary } from "@/server/billing/get-billing-summary";
import { prisma } from "@/server/prisma";

function statusLabelKey(status: TrainerPlanStatus) {
  switch (status) {
    case "ACTIVE":
      return "statusActive" as const;
    case "PAST_DUE":
      return "statusPastDue" as const;
    case "CANCELED":
      return "statusCanceled" as const;
    case "INCOMPLETE":
      return "statusIncomplete" as const;
    case "NONE":
    default:
      return "statusNone" as const;
  }
}

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const t = await getTranslations("billing");
  const params = await Promise.resolve(searchParams);
  const { trainerId } = await requireTrainerId();

  const [summary, trainer] = await Promise.all([
    getBillingSummary(trainerId),
    prisma.trainer.findUniqueOrThrow({
      where: { id: trainerId },
      select: { stripeCustomerId: true },
    }),
  ]);

  const planLabel = summary.plan === "PRO" ? t("planPro") : t("planFree");
  const usageLabel = summary.entitled
    ? t("unlimited")
    : t("usageValue", { count: summary.clientCount, limit: summary.limit });

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>

      {params.success ? (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
          {t("successFlash")}
        </p>
      ) : null}
      {params.canceled ? (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
          {t("canceledFlash")}
        </p>
      ) : null}

      <Card className="space-y-4 p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("plan")}</dt>
            <dd className="font-medium text-foreground">{planLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("status")}</dt>
            <dd className="font-medium text-foreground">
              {t(statusLabelKey(summary.planStatus))}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("usage")}</dt>
            <dd className="font-medium text-foreground">{usageLabel}</dd>
          </div>
        </dl>

        {!summary.entitled ? (
          <p className="text-sm text-muted-foreground">
            {t("limitHint", { limit: summary.limit })}
          </p>
        ) : null}

        <BillingActions
          hasCustomer={!!trainer.stripeCustomerId}
          isPro={summary.entitled}
        />
      </Card>
    </section>
  );
}
