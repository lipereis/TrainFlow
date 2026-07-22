"use client";

import { useTranslations } from "next-intl";
import { inputClass, labelClass, type WorkoutProgramDto } from "../wizard/types";
import { ObservationField } from "./observation-field";

type Props = {
  program: WorkoutProgramDto;
  clientName: string;
  trainerName: string;
  clientObservations: string;
  onPatch: (patch: Partial<WorkoutProgramDto>) => void;
  onClientObservationsChange: (observations: string) => void;
};

/** Prefer date-only YYYY-MM-DD; avoid UTC shift from Date parsing. */
function dateInputValue(value: string | null): string {
  if (!value) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? "";
}

function toDateOnly(value: string): string {
  return value; // already YYYY-MM-DD from <input type="date">
}

function statusLabel(
  status: WorkoutProgramDto["status"],
  t: ReturnType<typeof useTranslations>,
) {
  if (status === "DRAFT") return t("statusDraft");
  if (status === "ACTIVE") return t("statusActive");
  return t("statusArchived");
}

function levelLabel(
  level: WorkoutProgramDto["level"],
  t: ReturnType<typeof useTranslations>,
  emDash: string,
) {
  if (level === "BEGINNER") return t("levelBeginner");
  if (level === "INTERMEDIATE") return t("levelIntermediate");
  if (level === "ADVANCED") return t("levelAdvanced");
  return emDash;
}

export function ProgramHeader({
  program,
  clientName,
  trainerName,
  clientObservations,
  onPatch,
  onClientObservationsChange,
}: Props) {
  const t = useTranslations("spreadsheet");
  const tCommon = useTranslations("common");
  const emDash = tCommon("emDash");

  return (
    <header className="space-y-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("client")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {clientName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("trainer")}
            </span>{" "}
            {trainerName}
          </p>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {statusLabel(program.status, t)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          <span>{t("program")}</span>
          <input
            className={inputClass}
            value={program.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          <span>{t("goal")}</span>
          <input
            className={inputClass}
            value={program.goal ?? ""}
            onChange={(e) => onPatch({ goal: e.target.value || null })}
          />
        </label>
        <label className={labelClass}>
          <span>{t("frequency")}</span>
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
          <span>{t("startDate")}</span>
          <input
            type="date"
            className={inputClass}
            value={dateInputValue(program.startDate)}
            onChange={(e) =>
              onPatch({
                startDate: e.target.value
                  ? toDateOnly(e.target.value)
                  : program.startDate,
              })
            }
          />
        </label>
        <label className={labelClass}>
          <span>{t("endDate")}</span>
          <input
            type="date"
            className={inputClass}
            value={dateInputValue(program.endDate)}
            onChange={(e) =>
              onPatch({
                endDate: e.target.value ? toDateOnly(e.target.value) : null,
              })
            }
          />
        </label>
        <div className={labelClass}>
          <span>{t("levelLocation")}</span>
          <p className="rounded border border-transparent px-1 py-2 text-sm text-zinc-700 dark:text-zinc-300">
            {levelLabel(program.level, t, emDash)} ·{" "}
            {program.location?.trim() || emDash}
          </p>
        </div>
      </div>

      <ObservationField
        label={t("clientObservations")}
        value={clientObservations}
        onChange={onClientObservationsChange}
        rows={2}
      />

      <ObservationField
        label={t("programObservations")}
        value={program.observations ?? ""}
        onChange={(observations) =>
          onPatch({ observations: observations || null })
        }
        rows={2}
      />
    </header>
  );
}
