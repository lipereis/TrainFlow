import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/clients/new"
            className="rounded bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {t("newClient")}
          </Link>
          <Link
            href="/workouts/new"
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {t("newWorkout")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("clients")}
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {clientsError ? "—" : clients.length}
          </p>
          {clientsError ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {clientsError}
            </p>
          ) : null}
        </div>
        <div className="rounded border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("programs")}
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {workouts.length}
          </p>
        </div>
        <div className="rounded border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("activePrograms")}
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {activeCount}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {t("recentPrograms")}
          </h2>
          <Link
            href="/clients"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            {t("viewClients")}
          </Link>
        </div>
        <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {recent.map((w) => {
            const statusLabel = programStatusLabel(w.status, t);
            return (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/workouts/${w.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {w.name}
                  </Link>
                  {statusLabel ? (
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {statusLabel}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/workouts/${w.id}`}
                  className="shrink-0 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  {t("open")}
                </Link>
              </li>
            );
          })}
          {recent.length === 0 ? (
            <li className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
              {t("noPrograms")}{" "}
              <Link href="/workouts/new" className="underline">
                {t("createOne")}
              </Link>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {t("clients")}
        </h2>
        <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {clients.slice(0, 8).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <Link
                href={`/clients/${c.id}`}
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {c.name}
              </Link>
              <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                {clientStatusLabel(c.status, tClients)}
              </span>
            </li>
          ))}
          {clients.length === 0 && !clientsError ? (
            <li className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
              {t("noClients")}
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
