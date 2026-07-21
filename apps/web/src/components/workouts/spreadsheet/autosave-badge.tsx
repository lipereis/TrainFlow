"use client";

import type { AutosaveStatus } from "@/hooks/use-autosave";

const LABELS: Record<AutosaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Error saving",
};

export function AutosaveBadge({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  const color =
    status === "error"
      ? "text-red-600"
      : status === "saving"
        ? "text-amber-700"
        : "text-emerald-700";
  return (
    <span className={`text-xs font-medium ${color}`} aria-live="polite">
      {LABELS[status]}
    </span>
  );
}
