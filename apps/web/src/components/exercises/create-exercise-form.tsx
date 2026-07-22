"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import type { CreateExerciseInput, ExerciseDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";

const inputClass =
  "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900";
const labelClass = "block space-y-1 text-sm text-zinc-900 dark:text-zinc-100";

const emptyForm = {
  name: "",
  primaryMuscle: "",
  category: "Compound",
  equipment: "Barbell",
  instructions: "",
  videoUrl: "",
};

export function CreateExerciseForm() {
  const t = useTranslations("exercises");
  const tCommon = useTranslations("common");
  const { getToken } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const video = form.videoUrl.trim();
      const body: CreateExerciseInput = {
        name: form.name.trim(),
        primaryMuscle: form.primaryMuscle.trim(),
        secondaryMuscles: [],
        category: form.category.trim() || "Compound",
        equipment: form.equipment.trim() || "Other",
        defaultInstructions: form.instructions.trim(),
        videoUrl: video ? video : null,
        alternativeIds: [],
      };
      await browserApiFetch<ExerciseDto>("/exercises", token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setForm(emptyForm);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {t("newCustom")}
        </button>
      ) : null}

      {open ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
              {t("createTitle")}
            </h2>
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              {tCommon("cancel")}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              <span>{t("name")}</span>
              <input
                className={inputClass}
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              <span>{t("primaryMuscle")}</span>
              <input
                className={inputClass}
                required
                value={form.primaryMuscle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryMuscle: e.target.value }))
                }
                placeholder={t("primaryMusclePlaceholder")}
              />
            </label>
            <label className={labelClass}>
              <span>{t("category")}</span>
              <input
                className={inputClass}
                required
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder={t("categoryPlaceholder")}
              />
            </label>
            <label className={labelClass}>
              <span>{t("equipment")}</span>
              <input
                className={inputClass}
                required
                value={form.equipment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, equipment: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              <span>{t("videoUrl")}</span>
              <input
                className={inputClass}
                type="url"
                value={form.videoUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, videoUrl: e.target.value }))
                }
                placeholder="https://"
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <span>{t("instructions")}</span>
              <textarea
                className={inputClass}
                rows={3}
                value={form.instructions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instructions: e.target.value }))
                }
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {busy ? t("creating") : t("createExercise")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
