"use client";

import { OBSERVATION_TEMPLATES } from "@trainflow/shared-types";
import { inputClass, labelClass } from "../wizard/types";

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  className?: string;
};

export function ObservationField({
  label,
  value,
  onChange,
  rows = 3,
  className,
}: Props) {
  function insertTemplate(template: string) {
    const next = value.trim()
      ? `${value.trim()}\n${template}`
      : template;
    onChange(next);
  }

  return (
    <label className={`${labelClass} ${className ?? ""}`}>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span>{label}</span>
        <select
          className="no-print max-w-[14rem] rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
          defaultValue=""
          aria-label={`Insert observation template for ${label}`}
          onChange={(e) => {
            const t = e.target.value;
            if (t) {
              insertTemplate(t);
              e.target.value = "";
            }
          }}
        >
          <option value="">Insert template…</option>
          {OBSERVATION_TEMPLATES.map((t) => (
            <option key={t} value={t}>
              {t.slice(0, 48)}
              {t.length > 48 ? "…" : ""}
            </option>
          ))}
        </select>
      </span>
      <textarea
        className={inputClass}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
