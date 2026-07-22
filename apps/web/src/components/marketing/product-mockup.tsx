import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export async function ProductMockup() {
  const t = await getTranslations("landing");

  const stats = [
    { label: t("mockActiveClients"), value: "12" },
    { label: t("mockPrograms"), value: "8" },
    { label: t("mockExportReady"), value: "3" },
  ];

  const rows = [
    ["Bench press", "4", "8–10", "60 kg"],
    ["Incline DB press", "3", "10–12", "22 kg"],
    ["Cable fly", "3", "12–15", "—"],
  ];

  return (
    <Card className="overflow-hidden border-border/80 shadow-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="ml-2 text-xs font-medium text-muted-foreground">
          TrainFlow · Program editor
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-background px-2 py-2.5 sm:px-3"
            >
              <p className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Day A · Push</p>
          <Badge className="border-primary/20 bg-primary/10 text-primary">Active</Badge>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-4 gap-px bg-border text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            <div className="bg-muted/60 px-2 py-2 sm:px-3">Exercise</div>
            <div className="bg-muted/60 px-2 py-2 text-center">Sets</div>
            <div className="bg-muted/60 px-2 py-2 text-center">Reps</div>
            <div className="bg-muted/60 px-2 py-2 text-center">Weight</div>
          </div>
          {rows.map(([exercise, sets, reps, weight]) => (
            <div
              key={exercise}
              className="grid grid-cols-4 gap-px border-t border-border bg-card text-[11px] sm:text-xs"
            >
              <div className="px-2 py-2.5 font-medium text-foreground sm:px-3">{exercise}</div>
              <div className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{sets}</div>
              <div className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{reps}</div>
              <div className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{weight}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
