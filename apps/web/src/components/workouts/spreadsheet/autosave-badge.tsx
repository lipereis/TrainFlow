"use client";

import type { AutosaveStatus } from "@/hooks/use-autosave";

const LABELS: Record<AutosaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Error saving",
};

type Props = {
  status: AutosaveStatus;
  onRetry?: () => void;
};

export function AutosaveBadge({ status, onRetry }: Props) {
  if (status === "idle") return null;
  const color =
    status === "error"
      ? "text-red-600"
      : status === "saving"
        ? "text-amber-700"
        : "text-emerald-700";
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${color}`} aria-live="polite">
      {LABELS[status]}
      {status === "error" && onRetry ? (
        <button
          type="button"
          className="rounded border border-red-300 px-1.5 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </span>
  );
}
