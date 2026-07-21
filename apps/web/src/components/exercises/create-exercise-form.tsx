"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { CreateExerciseInput, ExerciseDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-50";
const labelClass = "block space-y-1 text-sm";

const emptyForm = {
  name: "",
  primaryMuscle: "",
  category: "Compound",
  equipment: "Barbell",
  instructions: "",
  videoUrl: "",
};

export function CreateExerciseForm() {
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
      setError(err instanceof Error ? err.message : "Create failed");
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
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          New custom exercise
        </button>
      ) : null}

      {open ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 rounded border border-zinc-200 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">Create custom exercise</h2>
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-zinc-900"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              <span>Name</span>
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
              <span>Primary muscle</span>
              <input
                className={inputClass}
                required
                value={form.primaryMuscle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryMuscle: e.target.value }))
                }
                placeholder="e.g. Chest"
              />
            </label>
            <label className={labelClass}>
              <span>Category</span>
              <input
                className={inputClass}
                required
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g. Compound"
              />
            </label>
            <label className={labelClass}>
              <span>Equipment</span>
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
              <span>Video URL (optional)</span>
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
              <span>Instructions</span>
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

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create exercise"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
