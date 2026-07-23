import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { PortalExportButtons } from "@/components/portal-export-buttons";
import { Badge } from "@/components/ui/badge";
import { requireClientId } from "@/server/auth";
import { workoutsService } from "@/server/workouts.service";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function ClientPortalPage() {
  const t = await getTranslations("portal");
  const locale = await getLocale();

  let clientId: string;
  try {
    ({ clientId } = await requireClientId());
  } catch {
    redirect("/sign-in");
  }

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { name: true },
  });

  const programs = await workoutsService.listActiveForClient(clientId);

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("greeting", { name: client.name })}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
          <p className="font-medium text-foreground">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t("activePrograms")}
          </h2>
          {programs.map((program) => (
            <article
              key={program.id}
              className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-card sm:p-5"
            >
              <header className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {program.name}
                  </h3>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {t("statusActive")}
                  </Badge>
                </div>
                {program.goal ? (
                  <p className="text-sm text-muted-foreground">
                    {t("goal")}: {program.goal}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {t("schedule", {
                    days: program.daysPerWeek,
                    start: formatDate(program.startDate, locale),
                  })}
                </p>
                {program.observations ? (
                  <p className="text-sm text-muted-foreground">
                    {program.observations}
                  </p>
                ) : null}
                <div className="pt-2">
                  <PortalExportButtons workoutId={program.id} />
                </div>
              </header>

              <div className="space-y-6">
                {(program.days ?? []).map((day) => (
                  <div key={day.id} className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {day.name}
                        {day.focus ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {day.focus}
                          </span>
                        ) : null}
                      </h4>
                      {day.estimatedDurationMin != null ? (
                        <p className="text-xs text-muted-foreground">
                          {t("duration", { min: day.estimatedDurationMin })}
                        </p>
                      ) : null}
                    </div>

                    {(day.warmup || day.cooldown) && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {day.warmup ? (
                          <p>
                            <span className="font-medium text-foreground">
                              {t("warmup")}:
                            </span>{" "}
                            {day.warmup}
                          </p>
                        ) : null}
                        {day.cooldown ? (
                          <p>
                            <span className="font-medium text-foreground">
                              {t("cooldown")}:
                            </span>{" "}
                            {day.cooldown}
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="min-w-[32rem] w-full text-left text-sm">
                        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2">{t("colExercise")}</th>
                            <th className="px-3 py-2">{t("colSets")}</th>
                            <th className="px-3 py-2">{t("colReps")}</th>
                            <th className="px-3 py-2">{t("colWeight")}</th>
                            <th className="px-3 py-2">{t("colRest")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(day.exercises ?? []).map((ex) => {
                            const name =
                              ex.customName?.trim() || t("unnamedExercise");
                            const reps =
                              ex.repsMin === ex.repsMax
                                ? String(ex.repsMin)
                                : `${ex.repsMin}–${ex.repsMax}`;
                            const weight =
                              ex.weight != null
                                ? `${ex.weight} ${ex.weightUnit}`
                                : "—";
                            const rest =
                              ex.restSec != null
                                ? t("restSeconds", { sec: ex.restSec })
                                : "—";
                            return (
                              <tr key={ex.id}>
                                <td className="px-3 py-2 text-foreground">
                                  <div>{name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {ex.muscleGroup}
                                    {ex.observation
                                      ? ` · ${ex.observation}`
                                      : ""}
                                  </div>
                                </td>
                                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                  {ex.sets}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                  {reps}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                  {weight}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                  {rest}
                                </td>
                              </tr>
                            );
                          })}
                          {(day.exercises ?? []).length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-4 text-muted-foreground"
                              >
                                {t("noExercises")}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
