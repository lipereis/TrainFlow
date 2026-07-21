"use client";

import {
  dayTotals,
  emptyDisplay,
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

function fmtVolume(min: number | null, max: number | null): string {
  if (min === null || max === null) return "—";
  return `${min}–${max}`;
}

export function DayTotalsCard({ totals }: { totals: DayTotals }) {
  return (
    <div className="grid gap-2 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm sm:grid-cols-3">
      <div>
        <p className="text-xs text-zinc-500">Exercises / sets</p>
        <p className="font-medium">
          {totals.exerciseCount} / {totals.totalSets}
        </p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Reps / volume</p>
        <p className="font-medium">
          {totals.minReps}–{totals.maxReps} /{" "}
          {fmtVolume(totals.minVolume, totals.maxVolume)}
        </p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Est. duration</p>
        <p className="font-medium">
          {emptyDisplay(totals.estimatedDurationMin)} min
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
  const muscles = Object.entries(summary.setsByMuscle).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <section className="space-y-3" aria-label="Program summary">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Summary
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Sessions"
          value={`${summary.sessions}${
            daysPerWeek !== summary.sessions
              ? ` (freq. ${daysPerWeek}/wk)`
              : ""
          }`}
        />
        <SummaryTile label="Weekly sets" value={String(summary.totalSets)} />
        <SummaryTile
          label="Weekly volume"
          value={fmtVolume(summary.minVolume, summary.maxVolume)}
        />
        <SummaryTile
          label="Est. weekly time"
          value={`${emptyDisplay(summary.estimatedDurationMin)} min`}
        />
      </div>
      {muscles.length > 0 ? (
        <div className="rounded border border-zinc-200 bg-white p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Sets by muscle
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {muscles.map(([muscle, sets]) => (
              <li key={muscle}>
                <span className="text-zinc-500">{muscle}:</span>{" "}
                <span className="font-medium">{sets}</span>
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
    <div className="rounded border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
