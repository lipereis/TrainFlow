"use client";

import { ObservationTemplateInsert } from "@/components/observation-template-insert";
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
  return (
    <label className={`${labelClass} ${className ?? ""}`}>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span>{label}</span>
        <ObservationTemplateInsert
          value={value}
          onInsert={onChange}
          ariaLabel={`Insert observation template for ${label}`}
        />
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
