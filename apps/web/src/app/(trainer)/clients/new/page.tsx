import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ClientLimitNotice } from "@/app/(trainer)/clients/client-limit-notice";
import { NewClientForm } from "@/app/(trainer)/clients/new/new-client-form";
import { requireTrainerId } from "@/server/auth";
import {
  getBillingSummary,
  isAtClientCap,
} from "@/server/billing/get-billing-summary";

export default async function NewClientPage() {
  const t = await getTranslations("clients");
  const { trainerId } = await requireTrainerId();
  const summary = await getBillingSummary(trainerId);
  const atCap = isAtClientCap(summary);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("newClient")}
        </h1>
        <Link
          href="/clients"
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("back")}
        </Link>
      </div>
      {atCap ? (
        <ClientLimitNotice limit={summary.limit} />
      ) : (
        <NewClientForm />
      )}
    </section>
  );
}
