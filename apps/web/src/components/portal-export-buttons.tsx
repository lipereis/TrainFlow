"use client";

import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { downloadWorkoutExport } from "@/lib/api-download";

const btnSecondary =
  "rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export function PortalExportButtons({ workoutId }: { workoutId: string }) {
  const t = useTranslations("portal");
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport(format: "pdf" | "xlsx") {
    setBusy(true);
    setError(null);
    try {
      await downloadWorkoutExport(workoutId, format, getToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnSecondary}
          disabled={busy}
          onClick={() => void onExport("pdf")}
        >
          {t("downloadPdf")}
        </button>
        <button
          type="button"
          className={btnSecondary}
          disabled={busy}
          onClick={() => void onExport("xlsx")}
        >
          {t("downloadExcel")}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
