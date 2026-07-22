"use client";

import { useTranslations } from "next-intl";
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
  ariaLabel,
  className = "no-print max-w-[14rem] rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200",
  placeholder,
  truncateAt = 48,
  disabled = false,
}: Props) {
  const t = useTranslations("common");
  const resolvedAria = ariaLabel ?? t("insertObservationAria");
  const resolvedPlaceholder = placeholder ?? t("insertTemplate");

  return (
    <select
      className={className}
      defaultValue=""
      disabled={disabled}
      aria-label={resolvedAria}
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
      <option value="">{resolvedPlaceholder}</option>
      {OBSERVATION_TEMPLATES.map((tmpl) => (
        <option key={tmpl} value={tmpl}>
          {tmpl.slice(0, truncateAt)}
          {tmpl.length > truncateAt ? "…" : ""}
        </option>
      ))}
    </select>
  );
}
