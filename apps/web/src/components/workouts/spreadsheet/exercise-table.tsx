"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { EXECUTION_METHODS } from "@trainflow/shared-types";
import {
  formatRepRange,
  formatRest,
  formatWeight,
} from "@trainflow/workout-math";
import { ObservationTemplateInsert } from "@/components/observation-template-insert";
import {
  btnSecondary,
  exerciseDisplayName,
  type WorkoutExerciseDto,
} from "../wizard/types";

type Patch = Partial<WorkoutExerciseDto>;

type Props = {
  exercises: WorkoutExerciseDto[];
  busy?: boolean;
  otherDays?: { id: string; name: string }[];
  onPatch: (exerciseId: string, patch: Patch) => void;
  onRemove: (exerciseId: string) => void;
  onMoveUp: (exerciseId: string) => void;
  onMoveDown: (exerciseId: string) => void;
  onMoveToDay?: (exerciseId: string, targetDayId: string) => void;
};

const cellInput =
  "w-full min-w-[3.5rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-900 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-zinc-500";

const METHOD_LABEL_KEYS: Record<string, string> = {
  "Standard sets": "methodStandardSets",
  Superset: "methodSuperset",
  "Bi-set": "methodBiSet",
  "Tri-set": "methodTriSet",
  "Giant set": "methodGiantSet",
  "Drop set": "methodDropSet",
  "Rest-pause": "methodRestPause",
  Custom: "methodCustom",
};

/** Local draft + blur-save so incomplete URLs are not autosaved on every keystroke. */
function VideoUrlCell({
  value,
  disabled,
  placeholder,
  onCommit,
}: {
  value: string | null;
  disabled?: boolean;
  placeholder: string;
  onCommit: (videoUrl: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  return (
    <input
      className={`${cellInput} min-w-[6rem]`}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim() || null;
        const current = value ?? null;
        if (next !== current) onCommit(next);
      }}
    />
  );
}

export function ExerciseTable({
  exercises,
  busy,
  otherDays = [],
  onPatch,
  onRemove,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
}: Props) {
  const t = useTranslations("spreadsheet");
  const tCommon = useTranslations("common");
  const emDash = tCommon("emDash");

  const columns = useMemo<ColumnDef<WorkoutExerciseDto>[]>(
    () => [
      {
        id: "order",
        header: "#",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="w-5 text-xs text-zinc-500 dark:text-zinc-400">
              {row.index + 1}
            </span>
            <div className="no-print flex flex-col">
              <button
                type="button"
                className="px-1 text-[10px] text-zinc-500 disabled:opacity-30 dark:text-zinc-400"
                disabled={busy || row.index === 0}
                aria-label={t("moveUp")}
                onClick={() => onMoveUp(row.original.id)}
              >
                ▲
              </button>
              <button
                type="button"
                className="px-1 text-[10px] text-zinc-500 disabled:opacity-30 dark:text-zinc-400"
                disabled={busy || row.index === exercises.length - 1}
                aria-label={t("moveDown")}
                onClick={() => onMoveDown(row.original.id)}
              >
                ▼
              </button>
            </div>
          </div>
        ),
      },
      {
        id: "exercise",
        header: t("colExercise"),
        cell: ({ row }) => (
          <input
            className={`${cellInput} min-w-[8rem] font-medium`}
            value={exerciseDisplayName(row.original, t("exerciseFallback"))}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { customName: e.target.value })
            }
          />
        ),
      },
      {
        id: "muscle",
        header: t("colMuscle"),
        cell: ({ row }) => (
          <input
            className={`${cellInput} min-w-[5rem]`}
            value={row.original.muscleGroup}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { muscleGroup: e.target.value })
            }
          />
        ),
      },
      {
        id: "sets",
        header: t("colSets"),
        cell: ({ row }) => (
          <input
            type="number"
            min={1}
            className={`${cellInput} w-14`}
            value={row.original.sets}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, {
                sets: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        ),
      },
      {
        id: "reps",
        header: t("colRepRange"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              className={`${cellInput} w-12`}
              value={row.original.repsMin}
              disabled={busy}
              aria-label={t("minReps")}
              onChange={(e) =>
                onPatch(row.original.id, {
                  repsMin: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
            <span className="text-xs text-zinc-400">–</span>
            <input
              type="number"
              min={1}
              className={`${cellInput} w-12`}
              value={row.original.repsMax}
              disabled={busy}
              aria-label={t("maxReps")}
              onChange={(e) =>
                onPatch(row.original.id, {
                  repsMax: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
            <span className="sr-only print:not-sr-only print:inline">
              {formatRepRange(row.original.repsMin, row.original.repsMax)}
            </span>
          </div>
        ),
      },
      {
        id: "weight",
        header: t("colWeight"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              step="0.5"
              className={`${cellInput} w-16`}
              value={row.original.weight ?? ""}
              placeholder={emDash}
              disabled={busy}
              onChange={(e) => {
                const raw = e.target.value;
                onPatch(row.original.id, {
                  weight: raw === "" ? null : Math.max(0, Number(raw)),
                });
              }}
            />
            <select
              className={`${cellInput} w-14`}
              value={row.original.weightUnit}
              disabled={busy}
              aria-label={t("weightUnit")}
              onChange={(e) =>
                onPatch(row.original.id, {
                  weightUnit: e.target.value as "KG" | "LB",
                })
              }
            >
              <option value="KG">kg</option>
              <option value="LB">lb</option>
            </select>
            <span className="sr-only print:not-sr-only print:inline">
              {formatWeight(row.original.weight, row.original.weightUnit)}
            </span>
          </div>
        ),
      },
      {
        id: "rest",
        header: t("colRest"),
        cell: ({ row }) => (
          <div>
            <input
              type="number"
              min={0}
              className={`${cellInput} w-16`}
              value={row.original.restSec ?? ""}
              placeholder={emDash}
              disabled={busy}
              onChange={(e) => {
                const raw = e.target.value;
                onPatch(row.original.id, {
                  restSec: raw === "" ? null : Math.max(0, Number(raw)),
                });
              }}
            />
            <span className="sr-only print:not-sr-only print:inline">
              {formatRest(row.original.restSec)}
            </span>
          </div>
        ),
      },
      {
        id: "tempo",
        header: t("colTempo"),
        cell: ({ row }) => (
          <input
            className={`${cellInput} w-16`}
            value={row.original.tempo ?? ""}
            placeholder={emDash}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { tempo: e.target.value || null })
            }
          />
        ),
      },
      {
        id: "rpe",
        header: t("colRpe"),
        cell: ({ row }) => (
          <input
            type="number"
            min={1}
            max={10}
            step="0.5"
            className={`${cellInput} w-14`}
            value={row.original.rpe ?? ""}
            placeholder={emDash}
            disabled={busy}
            onChange={(e) => {
              const raw = e.target.value;
              onPatch(row.original.id, {
                rpe: raw === "" ? null : Number(raw),
              });
            }}
          />
        ),
      },
      {
        id: "rir",
        header: t("colRir"),
        cell: ({ row }) => (
          <input
            type="number"
            min={0}
            step="0.5"
            className={`${cellInput} w-14`}
            value={row.original.rir ?? ""}
            placeholder={emDash}
            disabled={busy}
            onChange={(e) => {
              const raw = e.target.value;
              onPatch(row.original.id, {
                rir: raw === "" ? null : Number(raw),
              });
            }}
          />
        ),
      },
      {
        id: "method",
        header: t("colMethod"),
        cell: ({ row }) => (
          <select
            className={`${cellInput} min-w-[7rem]`}
            value={row.original.method}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { method: e.target.value })
            }
          >
            {EXECUTION_METHODS.map((m) => {
              const key = METHOD_LABEL_KEYS[m];
              return (
                <option key={m} value={m}>
                  {key ? t(key as "methodStandardSets") : m}
                </option>
              );
            })}
          </select>
        ),
      },
      {
        id: "observation",
        header: t("colObservation"),
        cell: ({ row }) => {
          const value = row.original.observation ?? "";
          return (
            <div className="flex min-w-[10rem] flex-col gap-0.5">
              <ObservationTemplateInsert
                value={value}
                disabled={busy}
                truncateAt={40}
                placeholder={t("templateShort")}
                className={`${cellInput} no-print max-w-[10rem] text-xs`}
                onInsert={(next) =>
                  onPatch(row.original.id, { observation: next || null })
                }
              />
              <input
                className={`${cellInput} min-w-[8rem]`}
                value={value}
                placeholder={emDash}
                disabled={busy}
                onChange={(e) =>
                  onPatch(row.original.id, {
                    observation: e.target.value || null,
                  })
                }
              />
            </div>
          );
        },
      },
      {
        id: "alternative",
        header: t("colAlternative"),
        cell: ({ row }) => (
          <input
            className={`${cellInput} min-w-[6rem]`}
            value={row.original.alternativeText ?? ""}
            placeholder={emDash}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, {
                alternativeText: e.target.value || null,
              })
            }
          />
        ),
      },
      {
        id: "video",
        header: t("colVideo"),
        cell: ({ row }) => (
          <VideoUrlCell
            value={row.original.videoUrl}
            disabled={busy}
            placeholder={emDash}
            onCommit={(videoUrl) => onPatch(row.original.id, { videoUrl })}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="no-print flex flex-col gap-1">
            {otherDays.length > 0 && onMoveToDay ? (
              <select
                className="max-w-[8rem] rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                defaultValue=""
                disabled={busy}
                aria-label={t("moveToDayAria")}
                onChange={(e) => {
                  const target = e.target.value;
                  if (!target) return;
                  onMoveToDay(row.original.id, target);
                  e.target.value = "";
                }}
              >
                <option value="">{t("moveTo")}</option>
                {otherDays.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              className={`${btnSecondary} px-2 py-1 text-xs`}
              disabled={busy}
              onClick={() => onRemove(row.original.id)}
            >
              {t("remove")}
            </button>
          </div>
        ),
      },
    ],
    [
      busy,
      emDash,
      exercises.length,
      onMoveDown,
      onMoveToDay,
      onMoveUp,
      onPatch,
      onRemove,
      otherDays,
      t,
    ],
  );

  const table = useReactTable({
    data: exercises,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (exercises.length === 0) {
    return (
      <p className="rounded border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {t("noExercises")}
      </p>
    );
  }

  return (
    <div className="workout-table-scroll overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap border-b border-zinc-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-1 py-1 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
