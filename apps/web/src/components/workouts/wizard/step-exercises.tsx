"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ExerciseDto } from "@trainflow/shared-types";
import { ExercisePickerModal } from "./exercise-picker-modal";
import {
  btnPrimary,
  btnSecondary,
  exerciseDisplayName,
  type WorkoutDayDto,
  type WorkoutExerciseDto,
} from "./types";

type Props = {
  days: WorkoutDayDto[];
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onContinue: () => void;
  onAddExercise: (
    dayId: string,
    exercise: ExerciseDto,
  ) => Promise<void>;
  onRemoveExercise: (dayId: string, exerciseId: string) => Promise<void>;
  onDuplicateExercise: (
    dayId: string,
    exercise: WorkoutExerciseDto,
  ) => Promise<void>;
  onReorderExercises: (dayId: string, ids: string[]) => Promise<void>;
  onMoveExercise: (
    dayId: string,
    exerciseId: string,
    targetDayId: string,
  ) => Promise<void>;
};

function SortableExerciseRow({
  exercise,
  days,
  dayId,
  busy,
  onRemove,
  onDuplicate,
  onMove,
}: {
  exercise: WorkoutExerciseDto;
  days: WorkoutDayDto[];
  dayId: string;
  busy: boolean;
  onRemove: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onMove: (targetDayId: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: exercise.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const otherDays = days.filter((d) => d.id !== dayId);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-3 py-2 last:border-0"
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
        disabled={busy}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {exerciseDisplayName(exercise)}
        </p>
        <p className="text-xs text-zinc-500">
          {exercise.muscleGroup} · {exercise.sets}×{exercise.repsMin}–
          {exercise.repsMax}
        </p>
      </div>
      {otherDays.length > 0 ? (
        <select
          className="rounded border border-zinc-300 px-2 py-1 text-xs"
          disabled={busy}
          defaultValue=""
          onChange={(e) => {
            const target = e.target.value;
            e.target.value = "";
            if (target) void onMove(target);
          }}
        >
          <option value="">Move to…</option>
          {otherDays.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      ) : null}
      <button
        type="button"
        className={btnSecondary}
        disabled={busy}
        onClick={() => void onDuplicate()}
      >
        Duplicate
      </button>
      <button
        type="button"
        className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-700 disabled:opacity-50"
        disabled={busy}
        onClick={() => void onRemove()}
      >
        Remove
      </button>
    </li>
  );
}

export function StepExercises({
  days,
  busy,
  error,
  onBack,
  onContinue,
  onAddExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises,
  onMoveExercise,
}: Props) {
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeDay = useMemo(
    () => days.find((d) => d.id === activeDayId) ?? days[0],
    [days, activeDayId],
  );

  const exercises = activeDay?.exercises ?? [];

  async function handleDragEnd(event: DragEndEvent) {
    if (!activeDay) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(exercises, oldIndex, newIndex);
    await onReorderExercises(
      activeDay.id,
      next.map((e) => e.id),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Exercises per day</h2>
        <p className="text-sm text-zinc-500">
          Search the library, add custom exercises, reorder, duplicate, or move
          between days.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            className={
              day.id === activeDay?.id ? btnPrimary : btnSecondary
            }
            onClick={() => setActiveDayId(day.id)}
          >
            {day.name}
            <span className="ml-1 text-xs opacity-70">
              ({day.exercises.length})
            </span>
          </button>
        ))}
      </div>

      {!activeDay ? (
        <p className="text-sm text-zinc-500">Add days first.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium">{activeDay.name}</h3>
            <button
              type="button"
              className={btnSecondary}
              disabled={busy}
              onClick={() => setPickerOpen(true)}
            >
              Add exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <p className="rounded border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              No exercises on this day yet.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => void handleDragEnd(e)}
            >
              <SortableContext
                items={exercises.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="rounded border border-zinc-200 bg-white">
                  {exercises.map((ex) => (
                    <SortableExerciseRow
                      key={ex.id}
                      exercise={ex}
                      days={days}
                      dayId={activeDay.id}
                      busy={busy}
                      onRemove={() =>
                        onRemoveExercise(activeDay.id, ex.id)
                      }
                      onDuplicate={() =>
                        onDuplicateExercise(activeDay.id, ex)
                      }
                      onMove={(targetDayId) =>
                        onMoveExercise(activeDay.id, ex.id, targetDayId)
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickLibrary={(ex) =>
          activeDay
            ? onAddExercise(activeDay.id, ex)
            : Promise.reject(new Error("No day selected"))
        }
        onCreateCustom={(ex) =>
          activeDay
            ? onAddExercise(activeDay.id, ex)
            : Promise.reject(new Error("No day selected"))
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-between gap-2">
        <button type="button" className={btnSecondary} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || days.length === 0}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
