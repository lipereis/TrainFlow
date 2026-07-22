"use client";

import { useTranslations } from "next-intl";
import {
  dayTotals,
  weeklySummary,
  type DayTotals,
  type WeeklySummary,
} from "@trainflow/workout-math";
import type { WorkoutDayDto, WorkoutExerciseDto } from "../wizard/types";

function toCalc(ex: WorkoutExerciseDto) {
  return {
    sets: ex.sets,
    repsMin: ex.repsMin,
    repsMax: ex.repsMax,
    weight: ex.weight,
    restSec: ex.restSec,
    muscleGroup: ex.muscleGroup,
  };
}

export function computeDayTotals(exercises: WorkoutExerciseDto[]): DayTotals {
  return dayTotals(exercises.map(toCalc));
}

export function computeWeekly(days: WorkoutDayDto[]): WeeklySummary {
  return weeklySummary(
    days.map((d) => ({ exercises: d.exercises.map(toCalc) })),
  );
}

function fmtVolume(min: number | null, max: number | null, emDash: string): string {
  if (min === null || max === null) return emDash;
  return `${min}–${max}`;
}

export function DayTotalsCard({ totals }: { totals: DayTotals }) {
  const t = useTranslations("spreadsheet");
  const tCommon = useTranslations("common");
  const emDash = tCommon("emDash");

  return (
    <div className="grid gap-2 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:grid-cols-3">
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("exercisesSets")}
        </p>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {totals.exerciseCount} / {totals.totalSets}
        </p>
      </div>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("repsVolume")}
        </p>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {totals.minReps}–{totals.maxReps} /{" "}
          {fmtVolume(totals.minVolume, totals.maxVolume, emDash)}
        </p>
      </div>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("estDuration")}
        </p>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {t("minutes", {
            value:
              totals.estimatedDurationMin == null
                ? emDash
                : String(totals.estimatedDurationMin),
          })}
        </p>
      </div>
    </div>
  );
}

export function WeeklySummaryCards({
  summary,
  daysPerWeek,
}: {
  summary: WeeklySummary;
  daysPerWeek: number;
}) {
  const t = useTranslations("spreadsheet");
  const tCommon = useTranslations("common");
  const emDash = tCommon("emDash");
  const muscles = Object.entries(summary.setsByMuscle).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const sessionsValue =
    daysPerWeek !== summary.sessions
      ? t("sessionsWithFreq", {
          sessions: summary.sessions,
          daysPerWeek,
        })
      : String(summary.sessions);

  return (
    <section className="space-y-3" aria-label={t("summaryAria")}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("summary")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label={t("sessions")} value={sessionsValue} />
        <SummaryTile label={t("weeklySets")} value={String(summary.totalSets)} />
        <SummaryTile
          label={t("weeklyVolume")}
          value={fmtVolume(summary.minVolume, summary.maxVolume, emDash)}
        />
        <SummaryTile
          label={t("estWeeklyTime")}
          value={t("minutes", {
            value:
              summary.estimatedDurationMin == null
                ? emDash
                : String(summary.estimatedDurationMin),
          })}
        />
      </div>
      {muscles.length > 0 ? (
        <div className="rounded border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("setsByMuscle")}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {muscles.map(([muscle, sets]) => (
              <li key={muscle}>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {muscle}:
                </span>{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {sets}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
