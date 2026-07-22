import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ExerciseDto } from "@trainflow/shared-types";
import { CreateExerciseForm } from "@/components/exercises/create-exercise-form";
import { apiFetch } from "@/lib/api";

const MUSCLE_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Full body",
  "Cardio",
] as const;

const CATEGORY_OPTIONS = [
  "Compound",
  "Isolation",
  "Isometric",
  "Cardio",
] as const;

const MUSCLE_LABEL_KEYS: Record<(typeof MUSCLE_OPTIONS)[number], string> = {
  Chest: "muscleChest",
  Back: "muscleBack",
  Shoulders: "muscleShoulders",
  Biceps: "muscleBiceps",
  Triceps: "muscleTriceps",
  Quadriceps: "muscleQuadriceps",
  Hamstrings: "muscleHamstrings",
  Glutes: "muscleGlutes",
  Calves: "muscleCalves",
  Core: "muscleCore",
  "Full body": "muscleFullBody",
  Cardio: "muscleCardio",
};

const CATEGORY_LABEL_KEYS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  Compound: "categoryCompound",
  Isolation: "categoryIsolation",
  Isometric: "categoryIsometric",
  Cardio: "categoryCardio",
};

function muscleLabel(
  value: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  const key = MUSCLE_LABEL_KEYS[value as (typeof MUSCLE_OPTIONS)[number]];
  return key ? t(key) : value;
}

function categoryLabel(
  value: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  const key = CATEGORY_LABEL_KEYS[value as (typeof CATEGORY_OPTIONS)[number]];
  return key ? t(key) : value;
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ q?: string; muscle?: string; category?: string }>
    | { q?: string; muscle?: string; category?: string };
}) {
  const t = await getTranslations("exercises");
  const tCommon = await getTranslations("common");
  const params = await Promise.resolve(searchParams);
  const q = params.q?.trim() ?? "";
  const muscle = params.muscle?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (muscle) query.set("muscle", muscle);
  if (category) query.set("category", category);
  const qs = query.toString();

  let exercises: ExerciseDto[] = [];
  let error: string | null = null;

  try {
    exercises = await apiFetch<ExerciseDto[]>(
      `/exercises${qs ? `?${qs}` : ""}`,
    );
  } catch (e) {
    error = e instanceof Error ? e.message : t("loadFailed");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("description")}
        </p>
      </div>

      <CreateExerciseForm />

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-600 dark:text-zinc-400">{t("search")}</span>
          <input
            name="q"
            defaultValue={q}
            placeholder={t("namePlaceholder")}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-600 dark:text-zinc-400">{t("muscle")}</span>
          <select
            name="muscle"
            defaultValue={muscle}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">{t("all")}</option>
            {MUSCLE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {muscleLabel(m, t)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-600 dark:text-zinc-400">
            {t("category")}
          </span>
          <select
            name="category"
            defaultValue={category}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">{t("all")}</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c, t)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {t("filter")}
        </button>
        {q || muscle || category ? (
          <Link
            href="/exercises"
            className="rounded px-3 py-2 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            {tCommon("clear")}
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {exercises.map((ex) => (
          <li key={ex.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {ex.name}
                  </p>
                  {ex.trainerId ? (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {t("custom")}
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
                      {t("library")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {[
                    ex.primaryMuscle
                      ? muscleLabel(ex.primaryMuscle, t)
                      : null,
                    ex.category ? categoryLabel(ex.category, t) : null,
                    ex.equipment,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {ex.defaultInstructions ? (
                  <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {ex.defaultInstructions}
                  </p>
                ) : null}
                {ex.videoUrl ? (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-zinc-700 underline dark:text-zinc-300"
                  >
                    {t("video")}
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        {exercises.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
            {t("noMatch")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
