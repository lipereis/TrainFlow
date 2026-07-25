import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { BrowserChrome } from "@/components/marketing/atmosphere";
import { Badge } from "@/components/ui/badge";

const ROWS = [
  ["Bench press", "4", "8–10", "90s", "60 kg"],
  ["Incline DB press", "3", "10–12", "75s", "22 kg"],
  ["Cable fly", "3", "12–15", "60s", "—"],
  ["Triceps pushdown", "3", "12–15", "60s", "25 kg"],
] as const;

export async function WorkoutEditorMock({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  const t = await getTranslations("landing");

  return (
    <BrowserChrome title={t("mockEditorTitle")} className={className}>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("mockDayLabel")}
            </p>
            <p className="text-xs text-muted-foreground">{t("mockClientLabel")}</p>
          </div>
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            {t("mockActiveBadge")}
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[22rem]">
            <div className="grid grid-cols-5 gap-px bg-border text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              {(
                [
                  "mockColExercise",
                  "mockColSets",
                  "mockColReps",
                  "mockColRest",
                  "mockColLoad",
                ] as const
              ).map((key, idx) => (
                <div
                  key={key}
                  className={cn(
                    "bg-muted/60 px-2 py-2",
                    idx > 0 && "text-center",
                    idx === 0 && "sm:px-3",
                  )}
                >
                  {t(key)}
                </div>
              ))}
            </div>
            {ROWS.map(([exercise, sets, reps, rest, load], i) => (
              <div
                key={exercise}
                className={cn(
                  "grid grid-cols-5 gap-px border-t border-border bg-card text-[11px] sm:text-xs",
                  animate &&
                    i === 1 &&
                    "motion-safe:animate-[mktPulseRow_2.8s_ease-in-out_infinite]",
                )}
              >
                <div className="px-2 py-2.5 font-medium text-foreground sm:px-3">
                  {exercise}
                </div>
                {[sets, reps, rest, load].map((cell) => (
                  <div
                    key={`${exercise}-${cell}`}
                    className="px-2 py-2.5 text-center tabular-nums text-muted-foreground"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="rounded-lg border border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-primary">{t("mockNoteLabel")}: </span>
          {t("mockNoteBody")}
        </p>
      </div>
    </BrowserChrome>
  );
}

export async function ClientsMock({ className }: { className?: string }) {
  const t = await getTranslations("landing");
  const clients = [
    {
      name: t("mockClient1"),
      status: t("mockStatusActive"),
      goal: t("mockGoal1"),
    },
    {
      name: t("mockClient2"),
      status: t("mockStatusActive"),
      goal: t("mockGoal2"),
    },
    {
      name: t("mockClient3"),
      status: t("mockStatusInvite"),
      goal: t("mockGoal3"),
    },
  ];

  return (
    <BrowserChrome title={t("mockClientsTitle")} className={className}>
      <ul className="divide-y divide-border">
        {clients.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {c.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{c.goal}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                c.status === t("mockStatusActive")
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
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
  const items = [t("mockTpl1"), t("mockTpl2"), t("mockTpl3")];

  return (
    <BrowserChrome title={t("mockTemplatesTitle")} className={className}>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {items.map((label, i) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border border-border bg-muted/50 p-4",
              i === 0 && "ring-1 ring-primary/30",
            )}
          >
            <div className="mb-3 h-16 rounded-lg bg-gradient-to-br from-muted to-primary/15" />
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("mockTplMeta")}</p>
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
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          PDF
        </p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
          {t("mockPdfTitle")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("mockPdfSubtitle")}</p>
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-muted" />
              <div className="h-2 w-10 rounded-full bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {t("mockPdfFooter")}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Excel
        </p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
          {t("mockXlsxTitle")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("mockXlsxSubtitle")}</p>
        <div className="mt-5 overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-4 bg-muted text-[10px] font-medium uppercase text-muted-foreground">
            <div className="px-2 py-1.5">{t("mockColExercise")}</div>
            <div className="px-2 py-1.5 text-center">{t("mockColSets")}</div>
            <div className="px-2 py-1.5 text-center">{t("mockColReps")}</div>
            <div className="px-2 py-1.5 text-center">{t("mockColLoad")}</div>
          </div>
          {ROWS.slice(0, 3).map(([ex, s, r, , load]) => (
            <div
              key={ex}
              className="grid grid-cols-4 border-t border-border text-[11px] text-foreground"
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

export async function ProductMockup() {
  return <WorkoutEditorMock />;
}
