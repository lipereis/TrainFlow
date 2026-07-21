"use client";

import {
  btnPrimary,
  btnSecondary,
  exerciseDisplayName,
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

export function StepReview({
  program,
  clientName,
  busy,
  error,
  onBack,
  onGenerate,
}: Props) {
  const totalExercises = program.days.reduce(
    (n, d) => n + d.exercises.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-zinc-500">
          Confirm the draft, then generate the workout spreadsheet.
        </p>
      </div>

      <div className="space-y-4 rounded border border-zinc-200 bg-white p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Client</dt>
            <dd className="font-medium">{clientName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Program</dt>
            <dd className="font-medium">{program.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Goal</dt>
            <dd>{program.goal ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Frequency</dt>
            <dd>{program.daysPerWeek} days/week</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Dates</dt>
            <dd>
              {program.startDate.slice(0, 10)}
              {program.endDate ? ` → ${program.endDate.slice(0, 10)}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Level</dt>
            <dd>{program.level ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd>{program.status}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Totals</dt>
            <dd>
              {program.days.length} day{program.days.length === 1 ? "" : "s"},{" "}
              {totalExercises} exercise{totalExercises === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>

        {program.observations ? (
          <div className="text-sm">
            <p className="text-zinc-500">Observations</p>
            <p className="mt-1 whitespace-pre-wrap">{program.observations}</p>
          </div>
        ) : null}

        <div className="space-y-4 border-t border-zinc-100 pt-4">
          {program.days.map((day) => (
            <div key={day.id}>
              <h3 className="text-sm font-semibold">
                {day.name}
                {day.focus ? (
                  <span className="font-normal text-zinc-500">
                    {" "}
                    · {day.focus}
                  </span>
                ) : null}
              </h3>
              {day.exercises.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-500">No exercises</p>
              ) : (
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-zinc-700">
                  {day.exercises.map((ex) => (
                    <li key={ex.id}>
                      {exerciseDisplayName(ex)}{" "}
                      <span className="text-zinc-500">
                        ({ex.sets}×{ex.repsMin}–{ex.repsMax}, {ex.muscleGroup})
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-between gap-2">
        <button type="button" className={btnSecondary} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || program.days.length === 0}
          onClick={() => void onGenerate()}
        >
          {busy ? "Generating…" : "Generate Workout Spreadsheet"}
        </button>
      </div>
    </div>
  );
}
