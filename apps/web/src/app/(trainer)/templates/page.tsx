import Link from "next/link";
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
    error = e instanceof Error ? e.message : "Failed to load templates";
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sample programs are examples only — not prescriptions. Using a
          template creates a new draft workout for a client.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Goal</span>
          <input
            name="goal"
            defaultValue={goal}
            placeholder="e.g. Strength"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Days / week</span>
          <input
            name="daysPerWeek"
            defaultValue={daysPerWeek}
            placeholder="3"
            inputMode="numeric"
            className="w-24 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Filter
        </button>
        {q || goal || daysPerWeek ? (
          <Link
            href="/templates"
            className="rounded px-3 py-2 text-sm text-zinc-600 hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <p className="text-red-600">{error}</p> : null}

      {clients.length === 0 && !error ? (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Add a{" "}
          <Link href="/clients/new" className="underline">
            client
          </Link>{" "}
          before using a template.
        </p>
      ) : null}

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
        {templates.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{t.name}</p>
                {t.isSample ? (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-600">
                    Sample
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-zinc-500">
                {[
                  t.goal ?? "No goal",
                  t.daysPerWeek != null ? `${t.daysPerWeek}d/week` : null,
                  t.level,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {t.observations ? (
                <p className="text-sm text-zinc-500">{t.observations}</p>
              ) : null}
            </div>
            <UseTemplateButton template={t} clients={clients} />
          </li>
        ))}
        {templates.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500">
            No templates match your filters.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
