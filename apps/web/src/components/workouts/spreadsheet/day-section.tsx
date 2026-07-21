"use client";

import { useState } from "react";
import type { ExerciseDto } from "@trainflow/shared-types";
import { ExercisePickerModal } from "../wizard/exercise-picker-modal";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  type WorkoutDayDto,
  type WorkoutExerciseDto,
} from "../wizard/types";
import { ObservationField } from "./observation-field";
import { ExerciseTable } from "./exercise-table";
import { DayTotalsCard, computeDayTotals } from "./summary-cards";

type Props = {
  day: WorkoutDayDto;
  busy?: boolean;
  onPatchDay: (patch: Partial<WorkoutDayDto>) => void;
  onDuplicateDay: () => void;
  onAddExercise: (exercise: ExerciseDto) => Promise<void>;
  onPatchExercise: (
    exerciseId: string,
    patch: Partial<WorkoutExerciseDto>,
  ) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onReorderExercises: (orderedIds: string[]) => void;
};

export function DaySection({
  day,
  busy,
  onPatchDay,
  onDuplicateDay,
  onAddExercise,
  onPatchExercise,
  onRemoveExercise,
  onReorderExercises,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const totals = computeDayTotals(day.exercises);

  function move(exerciseId: string, dir: -1 | 1) {
    const ids = day.exercises.map((e) => e.id);
    const idx = ids.indexOf(exerciseId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= ids.length) return;
    const copy = [...ids];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    onReorderExercises(copy);
  }

  return (
    <section className="workout-day space-y-4 border-b border-zinc-200 py-6 print:break-inside-avoid">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span>Day title</span>
            <input
              className={inputClass}
              value={day.name}
              disabled={busy}
              onChange={(e) => onPatchDay({ name: e.target.value })}
            />
          </label>
          <label className={labelClass}>
            <span>Focus</span>
            <input
              className={inputClass}
              value={day.focus ?? ""}
              disabled={busy}
              onChange={(e) => onPatchDay({ focus: e.target.value || null })}
            />
          </label>
        </div>
        <button
          type="button"
          className={`${btnSecondary} no-print`}
          disabled={busy}
          onClick={onDuplicateDay}
        >
          Duplicate day
        </button>
      </div>

      <label className={labelClass}>
        <span>Warm-up</span>
        <textarea
          className={inputClass}
          rows={2}
          value={day.warmup ?? ""}
          disabled={busy}
          onChange={(e) => onPatchDay({ warmup: e.target.value || null })}
        />
      </label>

      <ExerciseTable
        exercises={day.exercises}
        busy={busy}
        onPatch={onPatchExercise}
        onRemove={onRemoveExercise}
        onMoveUp={(id) => move(id, -1)}
        onMoveDown={(id) => move(id, 1)}
      />

      <div className="no-print">
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={() => setPickerOpen(true)}
        >
          Add exercise
        </button>
      </div>

      <ObservationField
        label="Day observations"
        value={day.observations ?? ""}
        onChange={(observations) =>
          onPatchDay({ observations: observations || null })
        }
      />

      <label className={labelClass}>
        <span>Cooldown</span>
        <textarea
          className={inputClass}
          rows={2}
          value={day.cooldown ?? ""}
          disabled={busy}
          onChange={(e) => onPatchDay({ cooldown: e.target.value || null })}
        />
      </label>

      <DayTotalsCard totals={totals} />

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickLibrary={onAddExercise}
        onCreateCustom={onAddExercise}
      />
    </section>
  );
}
