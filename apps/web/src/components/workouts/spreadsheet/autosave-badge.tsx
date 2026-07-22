"use client";

import { useTranslations } from "next-intl";
import type { AutosaveStatus } from "@/hooks/use-autosave";

type Props = {
  status: AutosaveStatus;
  onRetry?: () => void;
};

export function AutosaveBadge({ status, onRetry }: Props) {
  const t = useTranslations("spreadsheet");
  const tCommon = useTranslations("common");

  if (status === "idle") return null;

  const label =
    status === "saving"
      ? t("autosaveSaving")
      : status === "saved"
        ? t("autosaveSaved")
        : t("autosaveError");

  const color =
    status === "error"
      ? "text-red-600 dark:text-red-400"
      : status === "saving"
        ? "text-amber-700 dark:text-amber-400"
        : "text-emerald-700 dark:text-emerald-400";

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-medium ${color}`}
      aria-live="polite"
    >
      {label}
      {status === "error" && onRetry ? (
        <button
          type="button"
          className="rounded border border-red-300 px-1.5 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          onClick={onRetry}
        >
          {tCommon("retry")}
        </button>
      ) : null}
    </span>
  );
}
