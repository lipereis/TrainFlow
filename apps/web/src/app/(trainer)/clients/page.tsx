import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { DeleteClientButton } from "@/components/delete-client-button";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api";
import { statusBadgeVariant } from "@/lib/status-badge";
import { requireTrainerId } from "@/server/auth";
import {
  getBillingSummary,
  isAtClientCap,
} from "@/server/billing/get-billing-summary";

function clientStatusLabel(
  status: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (status === "ACTIVE") return t("statusActive");
  if (status === "PENDING") return t("statusPending");
  if (status === "INACTIVE") return t("statusInactive");
  return status;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("clients");
  const tCommon = await getTranslations("common");
  const params = await Promise.resolve(searchParams);
  const q = params.q?.trim() ?? "";
  const { trainerId } = await requireTrainerId();
  const summary = await getBillingSummary(trainerId);
  const atCap = isAtClientCap(summary);

  let clients: ClientDto[] = [];
  let error: string | null = null;
  try {
    const path = q ? `/clients?q=${encodeURIComponent(q)}` : "/clients";
    clients = await apiFetch<ClientDto[]>(path);
  } catch (e) {
    error = e instanceof Error ? e.message : t("loadFailed");
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          atCap ? (
            <>
              <span
                className={buttonClassName(
                  "primary",
                  "sm",
                  "pointer-events-none opacity-50",
                )}
                aria-disabled="true"
              >
                {t("newClient")}
              </span>
              <span
                className={buttonClassName(
                  "secondary",
                  "sm",
                  "pointer-events-none opacity-50",
                )}
                aria-disabled="true"
              >
                {t("invite")}
              </span>
              <Link
                href="/settings/billing"
                className={buttonClassName("primary", "sm")}
              >
                {t("upgradeBilling")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/clients/new"
                className={buttonClassName("primary", "sm")}
              >
                {t("newClient")}
              </Link>
              <Link
                href="/clients/invite"
                className={buttonClassName("secondary", "sm")}
              >
                {t("invite")}
              </Link>
            </>
          )
        }
      />

      {atCap ? (
        <p className="text-sm text-muted-foreground">
          {t("limitReached", { limit: summary.limit })}
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
        <form
          method="get"
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="w-full sm:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className={buttonClassName("secondary", "sm")}
            >
              {tCommon("search")}
            </button>
            {q ? (
              <Link
                href="/clients"
                className="px-3 py-2 text-sm text-muted-foreground hover:underline"
              >
                {tCommon("clear")}
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Card className="overflow-hidden divide-y divide-border">
        <ul className="divide-y divide-border">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
            >
              <div>
                <Link
                  href={`/clients/${c.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {c.name}
                </Link>
                <p className="text-sm text-muted-foreground">{c.email}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant={statusBadgeVariant(c.status)}>
                  {clientStatusLabel(c.status, t)}
                </Badge>
                <Link
                  href={`/clients/${c.id}/edit`}
                  className={buttonClassName("ghost", "sm")}
                >
                  {t("edit")}
                </Link>
                <DeleteClientButton
                  clientId={c.id}
                  clientName={c.name}
                  variant="link"
                />
              </div>
            </li>
          ))}
          {clients.length === 0 && !error ? (
            <li className="px-4 py-8 text-center">
              {q ? (
                <p className="text-muted-foreground">{t("noMatch")}</p>
              ) : (
                <>
                  <p className="text-muted-foreground">{t("noClients")}</p>
                  {atCap ? (
                    <Link
                      href="/settings/billing"
                      className={buttonClassName(
                        "primary",
                        "sm",
                        "mt-3 inline-flex",
                      )}
                    >
                      {t("upgradeBilling")}
                    </Link>
                  ) : (
                    <Link
                      href="/clients/new"
                      className={buttonClassName(
                        "primary",
                        "sm",
                        "mt-3 inline-flex",
                      )}
                    >
                      {t("emptyCta")}
                    </Link>
                  )}
                </>
              )}
            </li>
          ) : null}
        </ul>
      </Card>
    </section>
  );
}
