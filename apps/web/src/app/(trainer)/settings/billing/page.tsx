import { getTranslations } from "next-intl/server";
import type { TrainerPlanStatus } from "@trainflow/db";
import { BillingActions } from "@/components/billing-actions";
import { Card } from "@/components/ui/card";
import {
  freeClientLimit,
  isProEntitled,
} from "@/server/billing/entitlements";
import { requireTrainerId } from "@/server/auth";
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
  searchParams:
    | Promise<{ success?: string; canceled?: string }>
    | { success?: string; canceled?: string };
}) {
  const t = await getTranslations("billing");
  const params = await Promise.resolve(searchParams);
  const { trainerId } = await requireTrainerId();

  const [trainer, clientCount] = await Promise.all([
    prisma.trainer.findUniqueOrThrow({
      where: { id: trainerId },
      select: {
        plan: true,
        planStatus: true,
        stripeCustomerId: true,
      },
    }),
    prisma.client.count({ where: { trainerId } }),
  ]);

  const entitled = isProEntitled(trainer);
  const limit = freeClientLimit();
  const planLabel = trainer.plan === "PRO" ? t("planPro") : t("planFree");
  const usageLabel = entitled
    ? t("unlimited")
    : t("usageValue", { count: clientCount, limit });

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
              {t(statusLabelKey(trainer.planStatus))}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("usage")}</dt>
            <dd className="font-medium text-foreground">{usageLabel}</dd>
          </div>
        </dl>

        {!entitled ? (
          <p className="text-sm text-muted-foreground">
            {t("limitHint", { limit })}
          </p>
        ) : null}

        <BillingActions
          hasCustomer={!!trainer.stripeCustomerId}
          isPro={entitled}
        />
      </Card>
    </section>
  );
}
