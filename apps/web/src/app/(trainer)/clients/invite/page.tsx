import { getTranslations } from "next-intl/server";
import { ClientLimitNotice } from "@/app/(trainer)/clients/client-limit-notice";
import { InviteClientForm } from "@/app/(trainer)/clients/invite/invite-client-form";
import { requireTrainerId } from "@/server/auth";
import {
  getBillingSummary,
  isAtClientCap,
} from "@/server/billing/get-billing-summary";

export default async function InviteClientPage() {
  const t = await getTranslations("clients");
  const { trainerId } = await requireTrainerId();
  const summary = await getBillingSummary(trainerId);
  const atCap = isAtClientCap(summary);

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("inviteTitle")}
      </h1>
      {atCap ? (
        <ClientLimitNotice limit={summary.limit} />
      ) : (
        <InviteClientForm />
      )}
    </section>
  );
}
