import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { UseTemplateButton } from "@/components/templates/use-template-button";
import { apiFetch } from "@/lib/api";

type TemplateListItem = {
  id: string;
  name: string;
  goal: string | null;
  daysPerWeek: number | null;
  level: string | null;
  isSample: boolean;
  observations: string | null;
  dayCount?: number;
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ q?: string; goal?: string; daysPerWeek?: string }>
    | { q?: string; goal?: string; daysPerWeek?: string };
}) {
  const t = await getTranslations("templates");
  const tCommon = await getTranslations("common");
  const params = await Promise.resolve(searchParams);
  const q = params.q?.trim() ?? "";
  const goal = params.goal?.trim() ?? "";
  const daysPerWeek = params.daysPerWeek?.trim() ?? "";

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (goal) query.set("goal", goal);
  if (daysPerWeek) query.set("daysPerWeek", daysPerWeek);
  const qs = query.toString();

  let templates: TemplateListItem[] = [];
  let clients: ClientDto[] = [];
  let error: string | null = null;

  try {
    const [tmpl, cl] = await Promise.all([
      apiFetch<TemplateListItem[]>(`/templates${qs ? `?${qs}` : ""}`),
      apiFetch<ClientDto[]>("/clients"),
    ]);
    templates = tmpl;
    clients = cl;
  } catch (e) {
    error = e instanceof Error ? e.message : t("loadFailed");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("description")}
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-600 dark:text-zinc-400">{t("search")}</span>
          <input
            name="q"
            defaultValue={q}
            placeholder={t("namePlaceholder")}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-600 dark:text-zinc-400">{t("goal")}</span>
          <input
            name="goal"
            defaultValue={goal}
            placeholder={t("goalPlaceholder")}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-600 dark:text-zinc-400">
            {t("daysPerWeek")}
          </span>
          <input
            name="daysPerWeek"
            defaultValue={daysPerWeek}
            placeholder="3"
            inputMode="numeric"
            className="w-24 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {t("filter")}
        </button>
        {q || goal || daysPerWeek ? (
          <Link
            href="/templates"
            className="rounded px-3 py-2 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            {tCommon("clear")}
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {clients.length === 0 && !error ? (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {t("needClientBefore")}{" "}
          <Link href="/clients/new" className="underline">
            {t("needClientLink")}
          </Link>{" "}
          {t("needClientAfter")}
        </p>
      ) : null}

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {templates.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </p>
                {item.isSample ? (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {t("sample")}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {[
                  item.goal ?? t("noGoal"),
                  item.daysPerWeek != null
                    ? t("daysPerWeekValue", { count: item.daysPerWeek })
                    : null,
                  item.level,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {item.observations ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {item.observations}
                </p>
              ) : null}
            </div>
            <UseTemplateButton template={item} clients={clients} />
          </li>
        ))}
        {templates.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
            {t("noMatch")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
