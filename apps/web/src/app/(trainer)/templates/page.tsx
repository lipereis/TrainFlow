import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { UseTemplateButton } from "@/components/templates/use-template-button";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
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
  searchParams: Promise<{ q?: string; goal?: string; daysPerWeek?: string }>;
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
      <PageHeader title={t("title")} subtitle={t("description")} />

      <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          <span className="text-muted-foreground">{t("search")}</span>
          <Input
            name="q"
            defaultValue={q}
            placeholder={t("namePlaceholder")}
            className="w-auto min-w-[12rem]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          <span className="text-muted-foreground">{t("goal")}</span>
          <Input
            name="goal"
            defaultValue={goal}
            placeholder={t("goalPlaceholder")}
            className="w-auto min-w-[10rem]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          <span className="text-muted-foreground">{t("daysPerWeek")}</span>
          <Input
            name="daysPerWeek"
            defaultValue={daysPerWeek}
            placeholder="3"
            inputMode="numeric"
            className="w-24"
          />
        </label>
        <button type="submit" className={buttonClassName("secondary", "sm")}>
          {t("filter")}
        </button>
        {q || goal || daysPerWeek ? (
          <Link
            href="/templates"
            className="px-3 py-2 text-sm text-muted-foreground hover:underline"
          >
            {tCommon("clear")}
          </Link>
        ) : null}
      </form>
      </div>

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

      <Card className="overflow-hidden divide-y divide-border">
        <ul className="divide-y divide-border">
          {templates.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-muted/40"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{item.name}</p>
                  {item.isSample ? <Badge>{t("sample")}</Badge> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge>{item.goal ?? t("noGoal")}</Badge>
                  {item.daysPerWeek != null ? (
                    <span>
                      {t("daysPerWeekValue", { count: item.daysPerWeek })}
                    </span>
                  ) : null}
                  {item.level ? <Badge>{item.level}</Badge> : null}
                </div>
                {item.observations ? (
                  <p className="text-sm text-muted-foreground">
                    {item.observations}
                  </p>
                ) : null}
              </div>
              <UseTemplateButton template={item} clients={clients} />
            </li>
          ))}
          {templates.length === 0 && !error ? (
            <li className="px-4 py-8 text-center text-muted-foreground">
              {t("noMatch")}
            </li>
          ) : null}
        </ul>
      </Card>
    </section>
  );
}
