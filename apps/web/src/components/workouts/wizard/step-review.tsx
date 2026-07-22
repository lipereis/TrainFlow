"use client";

import { useTranslations } from "next-intl";
import {
  btnPrimary,
  btnSecondary,
  exerciseDisplayName,
  translateMuscleLabel,
  type WorkoutProgramDto,
} from "./types";

type Props = {
  program: WorkoutProgramDto;
  clientName: string;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onGenerate: () => Promise<void>;
};

function levelLabel(
  level: WorkoutProgramDto["level"],
  t: ReturnType<typeof useTranslations>,
  emDash: string,
) {
  if (level === "BEGINNER") return t("levelBeginner");
  if (level === "INTERMEDIATE") return t("levelIntermediate");
  if (level === "ADVANCED") return t("levelAdvanced");
  return emDash;
}

function statusLabel(
  status: WorkoutProgramDto["status"],
  t: ReturnType<typeof useTranslations>,
) {
  if (status === "DRAFT") return t("statusDraft");
  if (status === "ACTIVE") return t("statusActive");
  return t("statusArchived");
}

export function StepReview({
  program,
  clientName,
  busy,
  error,
  onBack,
  onGenerate,
}: Props) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const tExercises = useTranslations("exercises");
  const totalExercises = program.days.reduce(
    (n, d) => n + d.exercises.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("reviewTitle")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("reviewDesc")}
        </p>
      </div>

      <div className="space-y-4 rounded border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("client")}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {clientName}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("program")}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {program.name}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("goal")}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {program.goal ?? tCommon("emDash")}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">
              {t("frequency")}
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {t("frequencyValue", { count: program.daysPerWeek })}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("dates")}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {program.startDate.slice(0, 10)}
              {program.endDate ? ` → ${program.endDate.slice(0, 10)}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("level")}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {levelLabel(program.level, t, tCommon("emDash"))}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("status")}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {statusLabel(program.status, t)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">{t("totals")}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {t("totalsValue", {
                days: program.days.length,
                exercises: totalExercises,
              })}
            </dd>
          </div>
        </dl>

        {program.observations ? (
          <div className="text-sm">
            <p className="text-zinc-500 dark:text-zinc-400">
              {t("observations")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
              {program.observations}
            </p>
          </div>
        ) : null}

        <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {program.days.map((day) => (
            <div key={day.id}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {day.name}
                {day.focus ? (
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    {" "}
                    · {day.focus}
                  </span>
                ) : null}
              </h3>
              {day.exercises.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {t("noExercises")}
                </p>
              ) : (
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  {day.exercises.map((ex) => (
                    <li key={ex.id}>
                      {exerciseDisplayName(ex, t("exerciseFallback"))}{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">
                        ({ex.sets}×{ex.repsMin}–{ex.repsMax},{" "}
                        {translateMuscleLabel(ex.muscleGroup, tExercises)})
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex justify-between gap-2">
        <button type="button" className={btnSecondary} onClick={onBack}>
          {tCommon("back")}
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || program.days.length === 0}
          onClick={() => void onGenerate()}
        >
          {busy ? t("generating") : t("generateSpreadsheet")}
        </button>
      </div>
    </div>
  );
}
