import Link from "next/link";
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

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ q?: string; muscle?: string; category?: string }>
    | { q?: string; muscle?: string; category?: string };
}) {
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
    error = e instanceof Error ? e.message : "Failed to load exercises";
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Global library plus your custom exercises. Custom entries appear for
          your account only.
        </p>
      </div>

      <CreateExerciseForm />

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Muscle</span>
          <select
            name="muscle"
            defaultValue={muscle}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {MUSCLE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Category</span>
          <select
            name="category"
            defaultValue={category}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Filter
        </button>
        {q || muscle || category ? (
          <Link
            href="/exercises"
            className="rounded px-3 py-2 text-sm text-zinc-600 hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <p className="text-red-600">{error}</p> : null}

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
        {exercises.map((ex) => (
          <li key={ex.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{ex.name}</p>
                  {ex.trainerId ? (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-600">
                      Custom
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-500">
                      Library
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {[ex.primaryMuscle, ex.category, ex.equipment]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {ex.defaultInstructions ? (
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {ex.defaultInstructions}
                  </p>
                ) : null}
                {ex.videoUrl ? (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-zinc-700 underline"
                  >
                    Video
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        {exercises.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500">
            No exercises match your filters.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
