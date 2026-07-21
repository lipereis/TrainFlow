"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { ClientDto, ExerciseDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";
import { useAutosave } from "@/hooks/use-autosave";
import {
  btnPrimary,
  btnSecondary,
  type WorkoutDayDto,
  type WorkoutExerciseDto,
  type WorkoutProgramDto,
} from "../wizard/types";
import { AutosaveBadge } from "./autosave-badge";
import { ProgramHeader } from "./program-header";
import { DaySection } from "./day-section";
import { WeeklySummaryCards, computeWeekly } from "./summary-cards";

type ProgramPatch = {
  kind: "program";
  body: Record<string, unknown>;
};

type DayPatch = {
  kind: "day";
  dayId: string;
  body: Record<string, unknown>;
};

type ExercisePatch = {
  kind: "exercise";
  dayId: string;
  exerciseId: string;
  body: Record<string, unknown>;
};

type ClientPatch = {
  kind: "client";
  clientId: string;
  body: Record<string, unknown>;
};

type SavePayload = ProgramPatch | DayPatch | ExercisePatch | ClientPatch;

function defaultExercisePayload(exercise: ExerciseDto) {
  return {
    exerciseId: exercise.id,
    customName: exercise.name,
    muscleGroup: exercise.primaryMuscle,
    category: exercise.category,
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    weight: null,
    weightUnit: "KG" as const,
    restSec: 90,
    method: "Standard sets" as const,
  };
}

type Props = {
  workoutId: string;
};

export function WorkoutSpreadsheet({ workoutId }: Props) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [program, setProgram] = useState<WorkoutProgramDto | null>(null);
  const [clientName, setClientName] = useState("Client");
  const [clientObservations, setClientObservations] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trainerName =
    user?.fullName?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Trainer";

  const load = useCallback(async () => {
    const token = await getToken();
    const data = await browserApiFetch<WorkoutProgramDto>(
      `/workouts/${workoutId}`,
      token,
    );
    setProgram(data);
    setClientId(data.clientId);
    try {
      const client = await browserApiFetch<ClientDto>(
        `/clients/${data.clientId}`,
        token,
      );
      setClientName(client.name);
      setClientObservations(client.observations ?? "");
    } catch {
      setClientName("Client");
      setClientObservations("");
    }
  }, [getToken, workoutId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load workout");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const save = useCallback(
    async (payload: SavePayload) => {
      const token = await getToken();
      if (payload.kind === "program") {
        await browserApiFetch(`/workouts/${workoutId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload.body),
        });
      } else if (payload.kind === "day") {
        await browserApiFetch(
          `/workouts/${workoutId}/days/${payload.dayId}`,
          token,
          { method: "PATCH", body: JSON.stringify(payload.body) },
        );
      } else if (payload.kind === "client") {
        await browserApiFetch(`/clients/${payload.clientId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload.body),
        });
      } else {
        await browserApiFetch(
          `/workouts/${workoutId}/days/${payload.dayId}/exercises/${payload.exerciseId}`,
          token,
          { method: "PATCH", body: JSON.stringify(payload.body) },
        );
      }
    },
    [getToken, workoutId],
  );

  const { status, schedule, retry } = useAutosave<SavePayload>({
    save,
    delayMs: 600,
    keyFor: (p) =>
      p.kind === "program"
        ? "program"
        : p.kind === "day"
          ? `day:${p.dayId}`
          : p.kind === "client"
            ? `client:${p.clientId}`
            : `ex:${p.dayId}:${p.exerciseId}`,
    merge: (existing, incoming) => ({
      ...incoming,
      body: { ...existing.body, ...incoming.body },
    }),
  });

  const weekly = useMemo(
    () => (program ? computeWeekly(program.days) : null),
    [program],
  );

  function patchProgram(patch: Partial<WorkoutProgramDto>) {
    setProgram((prev) => (prev ? { ...prev, ...patch } : prev));
    const body: Record<string, unknown> = {};
    for (const key of [
      "name",
      "goal",
      "startDate",
      "endDate",
      "daysPerWeek",
      "level",
      "location",
      "equipment",
      "observations",
      "status",
    ] as const) {
      if (key in patch) body[key] = patch[key];
    }
    if (Object.keys(body).length > 0) {
      schedule({ kind: "program", body });
    }
  }

  function patchClientObservations(observations: string) {
    setClientObservations(observations);
    if (!clientId) return;
    schedule({
      kind: "client",
      clientId,
      body: { observations: observations || null },
    });
  }

  function patchDay(dayId: string, patch: Partial<WorkoutDayDto>) {
    setProgram((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d) =>
          d.id === dayId ? { ...d, ...patch } : d,
        ),
      };
    });
    const body: Record<string, unknown> = {};
    for (const key of [
      "name",
      "focus",
      "estimatedDurationMin",
      "warmup",
      "cooldown",
      "observations",
      "sortOrder",
    ] as const) {
      if (key in patch) body[key] = patch[key];
    }
    if (Object.keys(body).length > 0) {
      schedule({ kind: "day", dayId, body });
    }
  }

  function patchExercise(
    dayId: string,
    exerciseId: string,
    patch: Partial<WorkoutExerciseDto>,
  ) {
    setProgram((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d) =>
          d.id !== dayId
            ? d
            : {
                ...d,
                exercises: d.exercises.map((e) =>
                  e.id === exerciseId ? { ...e, ...patch } : e,
                ),
              },
        ),
      };
    });
    const body: Record<string, unknown> = { ...patch };
    delete body.id;
    delete body.dayId;
    schedule({ kind: "exercise", dayId, exerciseId, body });
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function addExercise(dayId: string, exercise: ExerciseDto) {
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch(
        `/workouts/${workoutId}/days/${dayId}/exercises`,
        token,
        {
          method: "POST",
          body: JSON.stringify(defaultExercisePayload(exercise)),
        },
      );
      await load();
    }).catch(() => {
      /* error already set */
    });
  }

  async function removeExercise(dayId: string, exerciseId: string) {
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch(
        `/workouts/${workoutId}/days/${dayId}/exercises/${exerciseId}`,
        token,
        { method: "DELETE" },
      );
      setProgram((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          days: prev.days.map((d) =>
            d.id !== dayId
              ? d
              : {
                  ...d,
                  exercises: d.exercises.filter((e) => e.id !== exerciseId),
                },
          ),
        };
      });
    }).catch(() => {
      /* error already set */
    });
  }

  async function reorderExercises(dayId: string, orderedIds: string[]) {
    const previous =
      program?.days.find((d) => d.id === dayId)?.exercises ?? null;

    setProgram((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d) => {
          if (d.id !== dayId) return d;
          const map = new Map(d.exercises.map((e) => [e.id, e]));
          return {
            ...d,
            exercises: orderedIds
              .map((id, i) => {
                const ex = map.get(id);
                return ex ? { ...ex, sortOrder: i } : null;
              })
              .filter((e): e is WorkoutExerciseDto => e !== null),
          };
        }),
      };
    });

    try {
      await withBusy(async () => {
        const token = await getToken();
        await browserApiFetch(
          `/workouts/${workoutId}/days/${dayId}/exercises/reorder`,
          token,
          {
            method: "PUT",
            body: JSON.stringify({ ids: orderedIds }),
          },
        );
      });
    } catch {
      // Rollback optimistic order, then refresh from server.
      if (previous) {
        setProgram((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            days: prev.days.map((d) =>
              d.id === dayId ? { ...d, exercises: previous } : d,
            ),
          };
        });
      }
      try {
        await load();
      } catch {
        /* keep local rollback */
      }
    }
  }

  async function duplicateDay(dayId: string) {
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch(
        `/workouts/${workoutId}/days/${dayId}/duplicate`,
        token,
        { method: "POST" },
      );
      await load();
    }).catch(() => {
      /* error already set */
    });
  }

  async function duplicateProgram() {
    await withBusy(async () => {
      const token = await getToken();
      const copy = await browserApiFetch<WorkoutProgramDto>(
        `/workouts/${workoutId}/duplicate`,
        token,
        { method: "POST" },
      );
      router.push(`/workouts/${copy.id}`);
    }).catch(() => {
      /* error already set */
    });
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading workout…</p>;
  }

  if (!program) {
    return (
      <p className="text-sm text-red-600">
        {error ?? "Workout not found."}
      </p>
    );
  }

  return (
    <div className="workout-spreadsheet space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <AutosaveBadge status={status} onRetry={retry} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnSecondary}
            disabled={busy}
            onClick={() => window.print()}
          >
            Print
          </button>
          <button
            type="button"
            className={btnSecondary}
            disabled
            title="Available in Task 11"
          >
            Export Excel
          </button>
          <button
            type="button"
            className={btnSecondary}
            disabled
            title="Available in Task 11"
          >
            Export PDF
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={busy}
            onClick={() => void duplicateProgram()}
          >
            Duplicate program
          </button>
        </div>
      </div>

      {error ? (
        <p className="no-print rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ProgramHeader
        program={program}
        clientName={clientName}
        trainerName={trainerName}
        clientObservations={clientObservations}
        onPatch={patchProgram}
        onClientObservationsChange={patchClientObservations}
      />

      {weekly ? (
        <WeeklySummaryCards
          summary={weekly}
          daysPerWeek={program.daysPerWeek}
        />
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Days
        </h2>
        {program.days.length === 0 ? (
          <p className="text-sm text-zinc-500">No days in this program.</p>
        ) : (
          program.days.map((day) => (
            <DaySection
              key={day.id}
              day={day}
              busy={busy}
              onPatchDay={(patch) => patchDay(day.id, patch)}
              onDuplicateDay={() => void duplicateDay(day.id)}
              onAddExercise={(ex) => addExercise(day.id, ex)}
              onPatchExercise={(exerciseId, patch) =>
                patchExercise(day.id, exerciseId, patch)
              }
              onRemoveExercise={(exerciseId) =>
                void removeExercise(day.id, exerciseId)
              }
              onReorderExercises={(ids) =>
                void reorderExercises(day.id, ids)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
