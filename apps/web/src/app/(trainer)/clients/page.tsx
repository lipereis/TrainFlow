import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { DeleteClientButton } from "@/components/delete-client-button";
import { apiFetch } from "@/lib/api";

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
            href="/clients/invite"
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {t("invite")}
          </Link>
        </div>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="w-full max-w-sm rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {tCommon("search")}
        </button>
        {q ? (
          <Link
            href="/clients"
            className="rounded px-3 py-2 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            {tCommon("clear")}
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {clients.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <Link
                href={`/clients/${c.id}`}
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {c.name}
              </Link>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {c.email}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {clientStatusLabel(c.status, t)}
              </span>
              <Link
                href={`/clients/${c.id}/edit`}
                className="text-zinc-700 hover:underline dark:text-zinc-300"
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
          <li className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
            {q ? t("noMatch") : t("noClients")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
