import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { DeleteClientButton } from "@/components/delete-client-button";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
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
  searchParams: Promise<{ q?: string }> | { q?: string };
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {atCap ? (
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
          )}
        </div>
      </div>

      {atCap ? (
        <p className="text-sm text-muted-foreground">
          {t("limitReached", { limit: summary.limit })}
        </p>
      ) : null}

      <form method="get" className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="max-w-sm"
        />
        <button type="submit" className={buttonClassName("secondary", "sm")}>
          {tCommon("search")}
        </button>
        {q ? (
          <Link
            href="/clients"
            className="self-center px-3 py-2 text-sm text-muted-foreground hover:underline"
          >
            {tCommon("clear")}
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Card className="overflow-hidden divide-y divide-border">
        <ul className="divide-y divide-border">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
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
                <Badge>{clientStatusLabel(c.status, t)}</Badge>
                <Link
                  href={`/clients/${c.id}/edit`}
                  className="text-muted-foreground hover:underline"
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
            <li className="px-4 py-8 text-center text-muted-foreground">
              {q ? t("noMatch") : t("noClients")}
            </li>
          ) : null}
        </ul>
      </Card>
    </section>
  );
}
