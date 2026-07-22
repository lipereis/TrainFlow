import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
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
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("greeting", { name: client.name })}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {t("emptyTitle")}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("activePrograms")}
          </h2>
          {programs.map((program) => (
            <article
              key={program.id}
              className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {program.name}
                  </h3>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    {t("statusActive")}
                  </span>
                </div>
                {program.goal ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("goal")}: {program.goal}
                  </p>
                ) : null}
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {t("schedule", {
                    days: program.daysPerWeek,
                    start: formatDate(program.startDate, locale),
                  })}
                </p>
                {program.observations ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {program.observations}
                  </p>
                ) : null}
              </header>

              <div className="space-y-6">
                {(program.days ?? []).map((day) => (
                  <div key={day.id} className="space-y-3">
                    <div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {day.name}
                        {day.focus ? (
                          <span className="font-normal text-zinc-500">
                            {" "}
                            · {day.focus}
                          </span>
                        ) : null}
                      </h4>
                      {day.estimatedDurationMin != null ? (
                        <p className="text-xs text-zinc-500">
                          {t("duration", { min: day.estimatedDurationMin })}
                        </p>
                      ) : null}
                    </div>

                    {(day.warmup || day.cooldown) && (
                      <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {day.warmup ? (
                          <p>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {t("warmup")}:
                            </span>{" "}
                            {day.warmup}
                          </p>
                        ) : null}
                        {day.cooldown ? (
                          <p>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {t("cooldown")}:
                            </span>{" "}
                            {day.cooldown}
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                          <tr>
                            <th className="px-3 py-2">{t("colExercise")}</th>
                            <th className="px-3 py-2">{t("colSets")}</th>
                            <th className="px-3 py-2">{t("colReps")}</th>
                            <th className="px-3 py-2">{t("colWeight")}</th>
                            <th className="px-3 py-2">{t("colRest")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
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
                                <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                                  <div>{name}</div>
                                  <div className="text-xs text-zinc-500">
                                    {ex.muscleGroup}
                                    {ex.observation
                                      ? ` · ${ex.observation}`
                                      : ""}
                                  </div>
                                </td>
                                <td className="px-3 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {ex.sets}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {reps}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {weight}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {rest}
                                </td>
                              </tr>
                            );
                          })}
                          {(day.exercises ?? []).length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-4 text-zinc-500"
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
