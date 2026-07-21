"use client";

import { emptyDisplay } from "@trainflow/workout-math";
import { inputClass, labelClass, type WorkoutProgramDto } from "../wizard/types";
import { ObservationField } from "./observation-field";

type Props = {
  program: WorkoutProgramDto;
  clientName: string;
  onPatch: (patch: Partial<WorkoutProgramDto>) => void;
};

function dateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ProgramHeader({ program, clientName, onPatch }: Props) {
  return (
    <header className="space-y-4 border-b border-zinc-200 pb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Client
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{clientName}</h1>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs uppercase tracking-wide text-zinc-600">
          {program.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          <span>Program</span>
          <input
            className={inputClass}
            value={program.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          <span>Goal</span>
          <input
            className={inputClass}
            value={program.goal ?? ""}
            onChange={(e) => onPatch({ goal: e.target.value || null })}
          />
        </label>
        <label className={labelClass}>
          <span>Frequency (days/week)</span>
          <input
            type="number"
            min={1}
            max={7}
            className={inputClass}
            value={program.daysPerWeek}
            onChange={(e) =>
              onPatch({ daysPerWeek: Number(e.target.value) || 1 })
            }
          />
        </label>
        <label className={labelClass}>
          <span>Start date</span>
          <input
            type="date"
            className={inputClass}
            value={dateInputValue(program.startDate)}
            onChange={(e) =>
              onPatch({
                startDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : program.startDate,
              })
            }
          />
        </label>
        <label className={labelClass}>
          <span>End date</span>
          <input
            type="date"
            className={inputClass}
            value={dateInputValue(program.endDate)}
            onChange={(e) =>
              onPatch({
                endDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
          />
        </label>
        <div className={labelClass}>
          <span>Level / location</span>
          <p className="rounded border border-transparent px-1 py-2 text-sm text-zinc-700">
            {emptyDisplay(program.level)} · {emptyDisplay(program.location)}
          </p>
        </div>
      </div>

      <ObservationField
        label="Program observations"
        value={program.observations ?? ""}
        onChange={(observations) =>
          onPatch({ observations: observations || null })
        }
        rows={2}
      />
    </header>
  );
}
