"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { CreateExerciseInput, ExerciseDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "./types";

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
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [getToken],
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
      setError(e instanceof Error ? e.message : "Failed to add exercise");
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
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Exercise picker"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded border border-zinc-200 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h3 className="font-semibold">Add exercise</h3>
          <button
            type="button"
            className="text-sm text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex gap-2 border-b border-zinc-100 px-4 py-2 text-sm">
          <button
            type="button"
            className={tab === "library" ? btnPrimary : btnSecondary}
            onClick={() => setTab("library")}
          >
            Library
          </button>
          <button
            type="button"
            className={tab === "custom" ? btnPrimary : btnSecondary}
            onClick={() => setTab("custom")}
          >
            Custom
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

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
                  placeholder="Search exercises"
                />
                <button type="submit" className={btnSecondary}>
                  Search
                </button>
              </form>
              {loading ? (
                <p className="text-sm text-zinc-500">Searching…</p>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded border border-zinc-200">
                  {results.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void pick(ex)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <span>
                          <span className="font-medium">{ex.name}</span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {ex.primaryMuscle} · {ex.category}
                          </span>
                        </span>
                        <span className="text-xs text-zinc-500">Add</span>
                      </button>
                    </li>
                  ))}
                  {results.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-zinc-500">
                      No exercises found.
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(e) => void createCustom(e)}>
              <label className={labelClass}>
                <span>Name</span>
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
                <span>Primary muscle</span>
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
                <span>Category</span>
                <input
                  className={inputClass}
                  value={custom.category}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, category: e.target.value }))
                  }
                />
              </label>
              <label className={labelClass}>
                <span>Equipment</span>
                <input
                  className={inputClass}
                  value={custom.equipment}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, equipment: e.target.value }))
                  }
                />
              </label>
              <button type="submit" className={btnPrimary} disabled={busy}>
                {busy ? "Creating…" : "Create & add"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
