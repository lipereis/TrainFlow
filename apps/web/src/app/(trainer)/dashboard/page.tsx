import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api";
import { statusBadgeVariant } from "@/lib/status-badge";

type WorkoutListItem = {
  id: string;
  name: string;
  status?: string;
  clientId?: string;
  updatedAt?: string;
};

function programStatusLabel(
  status: string | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (status === "DRAFT") return t("statusDraft");
  if (status === "ACTIVE") return t("statusActive");
  if (status === "ARCHIVED") return t("statusArchived");
  return status ?? null;
}

function clientStatusLabel(
  status: string,
  tClients: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (status === "ACTIVE") return tClients("statusActive");
  if (status === "PENDING") return tClients("statusPending");
  if (status === "INACTIVE") return tClients("statusInactive");
  return status;
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tClients = await getTranslations("clients");

  let clients: ClientDto[] = [];
  let clientsError: string | null = null;
  try {
    clients = await apiFetch<ClientDto[]>("/clients");
  } catch (e) {
    clientsError =
      e instanceof Error ? e.message : t("loadClientsFailed");
  }

  let workouts: WorkoutListItem[] = [];
  try {
    workouts = await apiFetch<WorkoutListItem[]>("/workouts");
  } catch {
    workouts = [];
  }

  const recent = workouts.slice(0, 8);
  const activeCount = workouts.filter((w) => w.status === "ACTIVE").length;

  return (
    <section className="space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Link
              href="/clients/new"
              className={buttonClassName("primary", "sm")}
            >
              {t("newClient")}
            </Link>
            <Link
              href="/workouts/new"
              className={buttonClassName("secondary", "sm")}
            >
              {t("newWorkout")}
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-2 border-l-primary/40 p-5">
          <p className="text-sm text-muted-foreground">{t("clients")}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
            {clientsError ? "—" : clients.length}
          </p>
          {clientsError ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {clientsError}
            </p>
          ) : null}
        </Card>
        <Card className="border-l-2 border-l-primary/40 p-5">
          <p className="text-sm text-muted-foreground">{t("programs")}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
            {workouts.length}
          </p>
        </Card>
        <Card className="border-l-2 border-l-primary/40 p-5">
          <p className="text-sm text-muted-foreground">
            {t("activePrograms")}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
            {activeCount}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">
            {t("recentPrograms")}
          </h2>
          <Link
            href="/clients"
            className="text-sm text-muted-foreground hover:underline"
          >
            {t("viewClients")}
          </Link>
        </div>
        <Card className="overflow-hidden divide-y divide-border">
          <ul className="divide-y divide-border">
            {recent.map((w) => {
              const statusLabel = programStatusLabel(w.status, t);
              return (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/workouts/${w.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {w.name}
                    </Link>
                    {statusLabel ? (
                      <div className="mt-1">
                        <Badge variant={statusBadgeVariant(w.status ?? "")}>
                          {statusLabel}
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                  <Link
                    href={`/workouts/${w.id}`}
                    className="shrink-0 text-sm text-muted-foreground hover:underline"
                  >
                    {t("open")}
                  </Link>
                </li>
              );
            })}
            {recent.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <p className="text-muted-foreground">{t("noPrograms")}</p>
                <Link
                  href="/workouts/new"
                  className={buttonClassName(
                    "primary",
                    "sm",
                    "mt-3 inline-flex",
                  )}
                >
                  {t("emptyProgramsCta")}
                </Link>
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">{t("clients")}</h2>
        <Card className="overflow-hidden divide-y divide-border">
          <ul className="divide-y divide-border">
            {clients.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40"
              >
                <Link
                  href={`/clients/${c.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {c.name}
                </Link>
                <Badge variant={statusBadgeVariant(c.status)}>
                  {clientStatusLabel(c.status, tClients)}
                </Badge>
              </li>
            ))}
            {clients.length === 0 && !clientsError ? (
              <li className="px-4 py-8 text-center">
                <p className="text-muted-foreground">{t("noClients")}</p>
                <Link
                  href="/clients/new"
                  className={buttonClassName(
                    "primary",
                    "sm",
                    "mt-3 inline-flex",
                  )}
                >
                  {t("emptyClientsCta")}
                </Link>
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    </section>
  );
}
