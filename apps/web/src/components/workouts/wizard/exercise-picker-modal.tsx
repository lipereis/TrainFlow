"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import type { CreateExerciseInput, ExerciseDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  translateCategoryLabel,
  translateMuscleLabel,
} from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onPickLibrary: (exercise: ExerciseDto) => Promise<void>;
  onCreateCustom: (exercise: ExerciseDto) => Promise<void>;
};

export function ExercisePickerModal({
  open,
  onClose,
  onPickLibrary,
  onCreateCustom,
}: Props) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const tExercises = useTranslations("exercises");
  const { getToken } = useAuth();
  const [tab, setTab] = useState<"library" | "custom">("library");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState({
    name: "",
    primaryMuscle: "",
    category: "Strength",
    equipment: "Other",
  });

  const search = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const path = query.trim()
          ? `/exercises?q=${encodeURIComponent(query.trim())}`
          : "/exercises";
        const list = await browserApiFetch<ExerciseDto[]>(path, token);
        setResults(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("searchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [getToken, t],
  );

  useEffect(() => {
    if (!open) return;
    void search("");
  }, [open, search]);

  if (!open) return null;

  async function pick(ex: ExerciseDto) {
    setBusy(true);
    setError(null);
    try {
      await onPickLibrary(ex);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("addExerciseFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function createCustom(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const body: CreateExerciseInput = {
        name: custom.name.trim(),
        primaryMuscle: custom.primaryMuscle.trim(),
        secondaryMuscles: [],
        category: custom.category.trim() || "Strength",
        equipment: custom.equipment.trim() || "Other",
        defaultInstructions: "",
        alternativeIds: [],
      };
      const created = await browserApiFetch<ExerciseDto>("/exercises", token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await onCreateCustom(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("pickerAria")}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {t("pickerTitle")}
          </h3>
          <button
            type="button"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>

        <div className="flex gap-2 border-b border-zinc-100 px-4 py-2 text-sm dark:border-zinc-800">
          <button
            type="button"
            className={tab === "library" ? btnPrimary : btnSecondary}
            onClick={() => setTab("library")}
          >
            {t("library")}
          </button>
          <button
            type="button"
            className={tab === "custom" ? btnPrimary : btnSecondary}
            onClick={() => setTab("custom")}
          >
            {t("custom")}
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {error ? (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}

          {tab === "library" ? (
            <div className="space-y-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void search(q);
                }}
              >
                <input
                  className={inputClass}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("searchExercisesPlaceholder")}
                />
                <button type="submit" className={btnSecondary}>
                  {tCommon("search")}
                </button>
              </form>
              {loading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("searching")}
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {results.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void pick(ex)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-800"
                      >
                        <span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {ex.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                            {translateMuscleLabel(ex.primaryMuscle, tExercises)}{" "}
                            ·{" "}
                            {translateCategoryLabel(ex.category, tExercises)}
                          </span>
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {t("add")}
                        </span>
                      </button>
                    </li>
                  ))}
                  {results.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      {t("noExercisesFound")}
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(e) => void createCustom(e)}>
              <label className={labelClass}>
                <span>{t("name")}</span>
                <input
                  className={inputClass}
                  required
                  value={custom.name}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, name: e.target.value }))
                  }
                />
              </label>
              <label className={labelClass}>
                <span>{t("primaryMuscle")}</span>
                <input
                  className={inputClass}
                  required
                  value={custom.primaryMuscle}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, primaryMuscle: e.target.value }))
                  }
                />
              </label>
              <label className={labelClass}>
                <span>{t("category")}</span>
                <input
                  className={inputClass}
                  value={custom.category}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, category: e.target.value }))
                  }
                />
              </label>
              <label className={labelClass}>
                <span>{t("equipment")}</span>
                <input
                  className={inputClass}
                  value={custom.equipment}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, equipment: e.target.value }))
                  }
                />
              </label>
              <button type="submit" className={btnPrimary} disabled={busy}>
                {busy ? t("creating") : t("createAndAdd")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
