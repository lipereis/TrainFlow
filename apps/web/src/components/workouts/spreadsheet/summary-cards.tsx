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
    <div className="grid gap-2 rounded-xl border border-border bg-muted p-3 text-sm sm:grid-cols-3">
      <div>
        <p className="text-xs text-muted-foreground">
          {t("exercisesSets")}
        </p>
        <p className="font-medium text-foreground">
          {totals.exerciseCount} / {totals.totalSets}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {t("repsVolume")}
        </p>
        <p className="font-medium text-foreground">
          {totals.minReps}–{totals.maxReps} /{" "}
          {fmtVolume(totals.minVolume, totals.maxVolume, emDash)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {t("estDuration")}
        </p>
        <p className="font-medium text-foreground">
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("setsByMuscle")}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {muscles.map(([muscle, sets]) => (
              <li key={muscle}>
                <span className="text-muted-foreground">
                  {muscle}:
                </span>{" "}
                <span className="font-medium text-foreground">
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
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
