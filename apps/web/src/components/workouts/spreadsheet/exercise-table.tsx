"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  EXECUTION_METHODS,
  OBSERVATION_TEMPLATES,
} from "@trainflow/shared-types";
import {
  emptyDisplay,
  formatRepRange,
  formatRest,
  formatWeight,
} from "@trainflow/workout-math";
import {
  btnSecondary,
  exerciseDisplayName,
  type WorkoutExerciseDto,
} from "../wizard/types";

type Patch = Partial<WorkoutExerciseDto>;

type Props = {
  exercises: WorkoutExerciseDto[];
  busy?: boolean;
  onPatch: (exerciseId: string, patch: Patch) => void;
  onRemove: (exerciseId: string) => void;
  onMoveUp: (exerciseId: string) => void;
  onMoveDown: (exerciseId: string) => void;
};

const cellInput =
  "w-full min-w-[3.5rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-zinc-300 focus:border-zinc-400 focus:outline-none";

export function ExerciseTable({
  exercises,
  busy,
  onPatch,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const columns = useMemo<ColumnDef<WorkoutExerciseDto>[]>(
    () => [
      {
        id: "order",
        header: "#",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="w-5 text-xs text-zinc-500">{row.index + 1}</span>
            <div className="no-print flex flex-col">
              <button
                type="button"
                className="px-1 text-[10px] text-zinc-500 disabled:opacity-30"
                disabled={busy || row.index === 0}
                aria-label="Move up"
                onClick={() => onMoveUp(row.original.id)}
              >
                ▲
              </button>
              <button
                type="button"
                className="px-1 text-[10px] text-zinc-500 disabled:opacity-30"
                disabled={busy || row.index === exercises.length - 1}
                aria-label="Move down"
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
        header: "Exercise",
        cell: ({ row }) => (
          <input
            className={`${cellInput} min-w-[8rem] font-medium`}
            value={exerciseDisplayName(row.original)}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { customName: e.target.value })
            }
          />
        ),
      },
      {
        id: "muscle",
        header: "Muscle",
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
        header: "Sets",
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
        header: "Rep range",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              className={`${cellInput} w-12`}
              value={row.original.repsMin}
              disabled={busy}
              aria-label="Min reps"
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
              aria-label="Max reps"
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
        header: "Weight",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              step="0.5"
              className={`${cellInput} w-16`}
              value={row.original.weight ?? ""}
              placeholder="—"
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
              aria-label="Weight unit"
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
        header: "Rest",
        cell: ({ row }) => (
          <div>
            <input
              type="number"
              min={0}
              className={`${cellInput} w-16`}
              value={row.original.restSec ?? ""}
              placeholder="—"
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
        header: "Tempo",
        cell: ({ row }) => (
          <input
            className={`${cellInput} w-16`}
            value={row.original.tempo ?? ""}
            placeholder="—"
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { tempo: e.target.value || null })
            }
          />
        ),
      },
      {
        id: "rpe",
        header: "RPE",
        cell: ({ row }) => (
          <input
            type="number"
            min={1}
            max={10}
            step="0.5"
            className={`${cellInput} w-14`}
            value={row.original.rpe ?? ""}
            placeholder="—"
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
        header: "RIR",
        cell: ({ row }) => (
          <input
            type="number"
            min={0}
            step="0.5"
            className={`${cellInput} w-14`}
            value={row.original.rir ?? ""}
            placeholder="—"
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
        header: "Method",
        cell: ({ row }) => (
          <select
            className={`${cellInput} min-w-[7rem]`}
            value={row.original.method}
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, { method: e.target.value })
            }
          >
            {EXECUTION_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: "observation",
        header: "Observation",
        cell: ({ row }) => {
          const value = row.original.observation ?? "";
          function insertTemplate(template: string) {
            const next = value.trim()
              ? `${value.trim()}\n${template}`
              : template;
            onPatch(row.original.id, { observation: next || null });
          }
          return (
            <div className="flex min-w-[10rem] flex-col gap-0.5">
              <select
                className={`${cellInput} no-print max-w-[10rem] text-xs`}
                defaultValue=""
                disabled={busy}
                aria-label="Insert observation template"
                onChange={(e) => {
                  const t = e.target.value;
                  if (t) {
                    insertTemplate(t);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Template…</option>
                {OBSERVATION_TEMPLATES.map((t) => (
                  <option key={t} value={t}>
                    {t.slice(0, 40)}
                    {t.length > 40 ? "…" : ""}
                  </option>
                ))}
              </select>
              <input
                className={`${cellInput} min-w-[8rem]`}
                value={value}
                placeholder="—"
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
        header: "Alternative",
        cell: ({ row }) => (
          <input
            className={`${cellInput} min-w-[6rem]`}
            value={row.original.alternativeText ?? ""}
            placeholder="—"
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
        header: "Video",
        cell: ({ row }) => (
          <input
            className={`${cellInput} min-w-[6rem]`}
            value={row.original.videoUrl ?? ""}
            placeholder="—"
            disabled={busy}
            onChange={(e) =>
              onPatch(row.original.id, {
                videoUrl: e.target.value || null,
              })
            }
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            className={`${btnSecondary} no-print px-2 py-1 text-xs`}
            disabled={busy}
            onClick={() => onRemove(row.original.id)}
          >
            Remove
          </button>
        ),
      },
    ],
    [busy, exercises.length, onMoveDown, onMoveUp, onPatch, onRemove],
  );

  const table = useReactTable({
    data: exercises,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (exercises.length === 0) {
    return (
      <p className="rounded border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500">
        No exercises yet. Add one from the library.
      </p>
    );
  }

  return (
    <div className="workout-table-scroll overflow-x-auto rounded border border-zinc-200">
      <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
        <thead className="bg-zinc-100">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap border-b border-zinc-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600"
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
            <tr key={row.id} className="border-b border-zinc-100 last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-1 py-1 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Print-friendly formatted preview of key fields */}
      <p className="sr-only">
        Formatted samples use {emptyDisplay("—")} for empty cells.
      </p>
    </div>
  );
}
