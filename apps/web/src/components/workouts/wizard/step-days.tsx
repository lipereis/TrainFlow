"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  btnPrimary,
  btnSecondary,
  dayLetterName,
  DAY_LETTERS,
  inputClass,
  labelClass,
  type WorkoutDayDto,
} from "./types";

type Props = {
  days: WorkoutDayDto[];
  daysPerWeek: number;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onContinue: () => void;
  onAddDay: (name: string, focus: string | null) => Promise<void>;
  onUpdateDay: (
    dayId: string,
    patch: { name?: string; focus?: string | null },
  ) => Promise<void>;
  onRemoveDay: (dayId: string) => Promise<void>;
  onDuplicateDay: (dayId: string) => Promise<void>;
  onReorderDays: (ids: string[]) => Promise<void>;
  onSeedDays: () => Promise<void>;
};

function SortableDayRow({
  day,
  busy,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  day: WorkoutDayDto;
  busy: boolean;
  onUpdate: (patch: { name?: string; focus?: string | null }) => Promise<void>;
  onRemove: () => Promise<void>;
  onDuplicate: () => Promise<void>;
}) {
  const t = useTranslations("wizard");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: day.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const [name, setName] = useState(day.name);
  const [focus, setFocus] = useState(day.focus ?? "");

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3 last:border-0"
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded border border-border px-2 py-2 text-xs text-muted-foreground active:cursor-grabbing"
        aria-label={t("dragReorder")}
        disabled={busy}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <label className={`${labelClass} min-w-[10rem] flex-1`}>
        <span>{t("name")}</span>
        <input
          className={inputClass}
          value={name}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name.trim() !== day.name) {
              void onUpdate({ name: name.trim() });
            }
          }}
        />
      </label>
      <label className={`${labelClass} min-w-[10rem] flex-1`}>
        <span>{t("focus")}</span>
        <input
          className={inputClass}
          value={focus}
          disabled={busy}
          onChange={(e) => setFocus(e.target.value)}
          onBlur={() => {
            const next = focus.trim() || null;
            if (next !== (day.focus ?? null)) {
              void onUpdate({ focus: next });
            }
          }}
        />
      </label>
      <span className="pb-2 text-xs text-muted-foreground">
        {t("exerciseCount", { count: day.exercises.length })}
      </span>
      <button
        type="button"
        className={btnSecondary}
        disabled={busy}
        onClick={() => void onDuplicate()}
      >
        {t("duplicate")}
      </button>
      <button
        type="button"
        className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
        disabled={busy}
        onClick={() => void onRemove()}
      >
        {t("remove")}
      </button>
    </li>
  );
}

export function StepDays({
  days,
  daysPerWeek,
  busy,
  error,
  onBack,
  onContinue,
  onAddDay,
  onUpdateDay,
  onRemoveDay,
  onDuplicateDay,
  onReorderDays,
  onSeedDays,
}: Props) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [newName, setNewName] = useState("");
  const [newFocus, setNewFocus] = useState("");
  const seedLetter =
    DAY_LETTERS[Math.max(0, daysPerWeek - 1)] ?? String(daysPerWeek);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = days.findIndex((d) => d.id === active.id);
    const newIndex = days.findIndex((d) => d.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(days, oldIndex, newIndex);
    await onReorderDays(next.map((d) => d.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("daysTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("daysDesc", { count: daysPerWeek })}
        </p>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            {t("noDaysYet")}
          </p>
          <button
            type="button"
            className={btnPrimary}
            disabled={busy}
            onClick={() => void onSeedDays()}
          >
            {t("createSeedDays", {
              count: daysPerWeek,
              letter: seedLetter,
            })}
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <SortableContext
            items={days.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="rounded-xl border border-border bg-card">
              {days.map((day) => (
                <SortableDayRow
                  key={day.id}
                  day={day}
                  busy={busy}
                  onUpdate={(patch) => onUpdateDay(day.id, patch)}
                  onRemove={() => onRemoveDay(day.id)}
                  onDuplicate={() => onDuplicateDay(day.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim() || dayLetterName(days.length);
          void onAddDay(name, newFocus.trim() || null).then(() => {
            setNewName("");
            setNewFocus("");
          });
        }}
      >
        <label className={`${labelClass} min-w-[10rem] flex-1`}>
          <span>{t("newDayName")}</span>
          <input
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={dayLetterName(days.length)}
            disabled={busy}
          />
        </label>
        <label className={`${labelClass} min-w-[10rem] flex-1`}>
          <span>{t("focus")}</span>
          <input
            className={inputClass}
            value={newFocus}
            onChange={(e) => setNewFocus(e.target.value)}
            placeholder={t("focusPlaceholder")}
            disabled={busy}
          />
        </label>
        <button type="submit" className={btnSecondary} disabled={busy}>
          {t("addDay")}
        </button>
      </form>

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
          disabled={busy || days.length === 0}
          onClick={onContinue}
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
