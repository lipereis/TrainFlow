"use client";

import { OBSERVATION_TEMPLATES } from "@trainflow/shared-types";

type Props = {
  value: string;
  onInsert: (next: string) => void;
  ariaLabel?: string;
  className?: string;
  placeholder?: string;
  truncateAt?: number;
  disabled?: boolean;
};

export function ObservationTemplateInsert({
  value,
  onInsert,
  ariaLabel = "Insert observation template",
  className = "no-print max-w-[14rem] rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700",
  placeholder = "Insert template…",
  truncateAt = 48,
  disabled = false,
}: Props) {
  return (
    <select
      className={className}
      defaultValue=""
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => {
        const template = e.target.value;
        if (!template) return;
        const next = value.trim()
          ? `${value.trim()}\n${template}`
          : template;
        onInsert(next);
        e.target.value = "";
      }}
    >
      <option value="">{placeholder}</option>
      {OBSERVATION_TEMPLATES.map((t) => (
        <option key={t} value={t}>
          {t.slice(0, truncateAt)}
          {t.length > truncateAt ? "…" : ""}
        </option>
      ))}
    </select>
  );
}
