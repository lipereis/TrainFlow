import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { BrowserChrome } from "@/components/marketing/atmosphere";

const ROWS = [
  ["Bench press", "4", "8–10", "90s", "60 kg"],
  ["Incline DB press", "3", "10–12", "75s", "22 kg"],
  ["Cable fly", "3", "12–15", "60s", "—"],
  ["Triceps pushdown", "3", "12–15", "60s", "25 kg"],
] as const;

export async function WorkoutEditorMock({
  className,
  dark = false,
  animate = false,
}: {
  className?: string;
  dark?: boolean;
  animate?: boolean;
}) {
  const t = await getTranslations("landing");

  return (
    <BrowserChrome
      title={t("mockEditorTitle")}
      dark={dark}
      className={className}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-mkt-light-fg")}>
              {t("mockDayLabel")}
            </p>
            <p className={cn("text-xs", dark ? "text-mkt-dark-muted" : "text-mkt-light-muted-fg")}>
              {t("mockClientLabel")}
            </p>
          </div>
          <span className="rounded-lg bg-mkt-accent/15 px-2.5 py-1 text-xs font-medium text-mkt-accent">
            {t("mockActiveBadge")}
          </span>
        </div>

        <div
          className={cn(
            "overflow-x-auto rounded-xl border",
            dark ? "border-mkt-dark-border" : "border-black/8",
          )}
        >
          <div className="min-w-[22rem]">
            <div
              className={cn(
                "grid grid-cols-5 gap-px text-[10px] font-medium uppercase tracking-wide sm:text-xs",
                dark ? "bg-mkt-dark-border text-mkt-dark-muted" : "bg-black/5 text-mkt-light-muted-fg",
              )}
            >
              <div className={cn("px-2 py-2 sm:px-3", dark ? "bg-mkt-dark-surface" : "bg-mkt-light-muted")}>
                {t("mockColExercise")}
              </div>
              <div className={cn("px-2 py-2 text-center", dark ? "bg-mkt-dark-surface" : "bg-mkt-light-muted")}>
                {t("mockColSets")}
              </div>
              <div className={cn("px-2 py-2 text-center", dark ? "bg-mkt-dark-surface" : "bg-mkt-light-muted")}>
                {t("mockColReps")}
              </div>
              <div className={cn("px-2 py-2 text-center", dark ? "bg-mkt-dark-surface" : "bg-mkt-light-muted")}>
                {t("mockColRest")}
              </div>
              <div className={cn("px-2 py-2 text-center", dark ? "bg-mkt-dark-surface" : "bg-mkt-light-muted")}>
                {t("mockColLoad")}
              </div>
            </div>
            {ROWS.map(([exercise, sets, reps, rest, load], i) => (
              <div
                key={exercise}
                className={cn(
                  "grid grid-cols-5 gap-px border-t text-[11px] sm:text-xs",
                  dark ? "border-mkt-dark-border bg-mkt-dark-surface" : "border-black/5 bg-white",
                  animate && i === 1 && "motion-safe:animate-[mktPulseRow_2.8s_ease-in-out_infinite]",
                )}
              >
                <div className={cn("px-2 py-2.5 font-medium sm:px-3", dark ? "text-white" : "text-mkt-light-fg")}>
                  {exercise}
                </div>
                <div className={cn("px-2 py-2.5 text-center tabular-nums", dark ? "text-mkt-dark-muted" : "text-mkt-light-muted-fg")}>
                  {sets}
                </div>
                <div className={cn("px-2 py-2.5 text-center tabular-nums", dark ? "text-mkt-dark-muted" : "text-mkt-light-muted-fg")}>
                  {reps}
                </div>
                <div className={cn("px-2 py-2.5 text-center tabular-nums", dark ? "text-mkt-dark-muted" : "text-mkt-light-muted-fg")}>
                  {rest}
                </div>
                <div className={cn("px-2 py-2.5 text-center tabular-nums", dark ? "text-mkt-dark-muted" : "text-mkt-light-muted-fg")}>
                  {load}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className={cn("rounded-lg border px-3 py-2 text-xs leading-relaxed", dark ? "border-mkt-dark-border text-mkt-dark-muted" : "border-black/8 text-mkt-light-muted-fg")}>
          <span className="font-medium text-mkt-accent">{t("mockNoteLabel")}: </span>
          {t("mockNoteBody")}
        </p>
      </div>
    </BrowserChrome>
  );
}

export async function ClientsMock({ className }: { className?: string }) {
  const t = await getTranslations("landing");
  const clients = [
    { name: t("mockClient1"), status: t("mockStatusActive"), goal: t("mockGoal1") },
    { name: t("mockClient2"), status: t("mockStatusActive"), goal: t("mockGoal2") },
    { name: t("mockClient3"), status: t("mockStatusInvite"), goal: t("mockGoal3") },
  ];

  return (
    <BrowserChrome title={t("mockClientsTitle")} className={className}>
      <ul className="divide-y divide-black/5">
        {clients.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-mkt-light-fg">{c.name}</p>
              <p className="truncate text-xs text-mkt-light-muted-fg">{c.goal}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                c.status === t("mockStatusActive")
                  ? "bg-mkt-accent/15 text-mkt-accent"
                  : "bg-black/5 text-mkt-light-muted-fg",
              )}
            >
              {c.status}
            </span>
          </li>
        ))}
      </ul>
    </BrowserChrome>
  );
}

export async function TemplatesMock({ className }: { className?: string }) {
  const t = await getTranslations("landing");
  const items = [
    t("mockTpl1"),
    t("mockTpl2"),
    t("mockTpl3"),
  ];

  return (
    <BrowserChrome title={t("mockTemplatesTitle")} className={className}>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {items.map((label, i) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border border-black/8 bg-mkt-light-muted/80 p-4",
              i === 0 && "ring-1 ring-mkt-accent/40",
            )}
          >
            <div className="mb-3 h-16 rounded-lg bg-gradient-to-br from-mkt-light-fg/10 to-mkt-accent/20" />
            <p className="text-sm font-medium text-mkt-light-fg">{label}</p>
            <p className="mt-1 text-xs text-mkt-light-muted-fg">{t("mockTplMeta")}</p>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

export async function ExportDocsMock({ className }: { className?: string }) {
  const t = await getTranslations("landing");

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 sm:gap-6", className)}>
      <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-card sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mkt-accent">
          PDF
        </p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-mkt-light-fg">
          {t("mockPdfTitle")}
        </h3>
        <p className="mt-1 text-sm text-mkt-light-muted-fg">{t("mockPdfSubtitle")}</p>
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-mkt-light-muted" />
              <div className="h-2 w-10 rounded-full bg-mkt-light-muted" />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-black/8 bg-mkt-light-muted/60 px-3 py-2 text-xs text-mkt-light-muted-fg">
          {t("mockPdfFooter")}
        </div>
      </div>

      <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-card sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mkt-accent">
          Excel
        </p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-mkt-light-fg">
          {t("mockXlsxTitle")}
        </h3>
        <p className="mt-1 text-sm text-mkt-light-muted-fg">{t("mockXlsxSubtitle")}</p>
        <div className="mt-5 overflow-hidden rounded-lg border border-black/8">
          <div className="grid grid-cols-4 bg-mkt-light-muted text-[10px] font-medium uppercase text-mkt-light-muted-fg">
            <div className="px-2 py-1.5">{t("mockColExercise")}</div>
            <div className="px-2 py-1.5 text-center">{t("mockColSets")}</div>
            <div className="px-2 py-1.5 text-center">{t("mockColReps")}</div>
            <div className="px-2 py-1.5 text-center">{t("mockColLoad")}</div>
          </div>
          {ROWS.slice(0, 3).map(([ex, s, r, , load]) => (
            <div
              key={ex}
              className="grid grid-cols-4 border-t border-black/5 text-[11px] text-mkt-light-fg"
            >
              <div className="truncate px-2 py-1.5">{ex}</div>
              <div className="px-2 py-1.5 text-center tabular-nums">{s}</div>
              <div className="px-2 py-1.5 text-center tabular-nums">{r}</div>
              <div className="px-2 py-1.5 text-center tabular-nums">{load}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer WorkoutEditorMock — kept for any residual imports */
export async function ProductMockup() {
  return <WorkoutEditorMock />;
}
