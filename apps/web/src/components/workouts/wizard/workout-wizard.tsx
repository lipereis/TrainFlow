"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ExerciseDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";
import { WizardProgress } from "./progress-indicator";
import { StepClient } from "./step-client";
import { StepProgram, type ProgramFormValues } from "./step-program";
import { StepDays } from "./step-days";
import { StepExercises } from "./step-exercises";
import { StepReview } from "./step-review";
import {
  dayLetterName,
  type WizardStep,
  type WorkoutDayDto,
  type WorkoutExerciseDto,
  type WorkoutProgramDto,
} from "./types";

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

type WizardProps = {
  initialClientId?: string | null;
  initialClientName?: string | null;
};

export function WorkoutWizard({
  initialClientId = null,
  initialClientName = null,
}: WizardProps) {
  const t = useTranslations("wizard");
  const { getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialClientId ? 2 : 1);
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [clientName, setClientName] = useState<string | null>(initialClientName);
  const [program, setProgram] = useState<WorkoutProgramDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProgram = useCallback(
    async (workoutId: string) => {
      const token = await getToken();
      const fresh = await browserApiFetch<WorkoutProgramDto>(
        `/workouts/${workoutId}`,
        token,
      );
      setProgram(fresh);
      setClientId(fresh.clientId);
      return fresh;
    },
    [getToken],
  );

  async function createDraft(values: ProgramFormValues) {
    if (!clientId) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (program) {
        const updated = await browserApiFetch<WorkoutProgramDto>(
          `/workouts/${program.id}`,
          token,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: values.name,
              goal: values.goal,
              startDate: values.startDate,
              endDate: values.endDate,
              daysPerWeek: values.daysPerWeek,
              level: values.level,
              location: values.location,
              equipment: values.equipment,
              observations: values.observations,
            }),
          },
        );
        const fresh = await refreshProgram(updated.id);
        setProgram(fresh);
      } else {
        const created = await browserApiFetch<WorkoutProgramDto>(
          "/workouts",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              clientId,
              name: values.name,
              goal: values.goal,
              startDate: values.startDate,
              endDate: values.endDate,
              daysPerWeek: values.daysPerWeek,
              level: values.level,
              location: values.location,
              equipment: values.equipment,
              observations: values.observations,
            }),
          },
        );
        setProgram(created);
        setClientId(created.clientId);
      }
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveProgramFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("requestFailed"));
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function seedDays() {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      const count = program.daysPerWeek;
      for (let i = 0; i < count; i++) {
        await browserApiFetch<WorkoutDayDto>(
          `/workouts/${program.id}/days`,
          token,
          {
            method: "POST",
            body: JSON.stringify({ name: dayLetterName(i) }),
          },
        );
      }
      await refreshProgram(program.id);
    });
  }

  async function addDay(name: string, focus: string | null) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<WorkoutDayDto>(
        `/workouts/${program.id}/days`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ name, focus }),
        },
      );
      await refreshProgram(program.id);
    });
  }

  async function updateDay(
    dayId: string,
    patch: { name?: string; focus?: string | null },
  ) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<WorkoutDayDto>(
        `/workouts/${program.id}/days/${dayId}`,
        token,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      await refreshProgram(program.id);
    });
  }

  async function removeDay(dayId: string) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<void>(
        `/workouts/${program.id}/days/${dayId}`,
        token,
        { method: "DELETE" },
      );
      await refreshProgram(program.id);
    });
  }

  async function duplicateDay(dayId: string) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<WorkoutDayDto>(
        `/workouts/${program.id}/days/${dayId}/duplicate`,
        token,
        { method: "POST" },
      );
      await refreshProgram(program.id);
    });
  }

  async function reorderDays(ids: string[]) {
    if (!program) return;
    // Optimistic local order
    setProgram({
      ...program,
      days: ids
        .map((id, i) => {
          const day = program.days.find((d) => d.id === id);
          return day ? { ...day, sortOrder: i } : null;
        })
        .filter((d): d is WorkoutDayDto => d != null),
    });
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch(`/workouts/${program.id}/days/reorder`, token, {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
      await refreshProgram(program.id);
    });
  }

  async function addExercise(dayId: string, exercise: ExerciseDto) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<WorkoutExerciseDto>(
        `/workouts/${program.id}/days/${dayId}/exercises`,
        token,
        {
          method: "POST",
          body: JSON.stringify(defaultExercisePayload(exercise)),
        },
      );
      await refreshProgram(program.id);
    });
  }

  async function removeExercise(dayId: string, exerciseId: string) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<void>(
        `/workouts/${program.id}/days/${dayId}/exercises/${exerciseId}`,
        token,
        { method: "DELETE" },
      );
      await refreshProgram(program.id);
    });
  }

  async function duplicateExercise(
    dayId: string,
    exercise: WorkoutExerciseDto,
  ) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch<WorkoutExerciseDto>(
        `/workouts/${program.id}/days/${dayId}/exercises`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            exerciseId: exercise.exerciseId,
            customName: exercise.customName,
            muscleGroup: exercise.muscleGroup,
            category: exercise.category,
            sets: exercise.sets,
            repsMin: exercise.repsMin,
            repsMax: exercise.repsMax,
            weight: exercise.weight,
            weightUnit: exercise.weightUnit,
            restSec: exercise.restSec,
            tempo: exercise.tempo,
            rpe: exercise.rpe,
            rir: exercise.rir,
            method: exercise.method,
            observation: exercise.observation,
            videoUrl: exercise.videoUrl,
            alternativeText: exercise.alternativeText,
          }),
        },
      );
      await refreshProgram(program.id);
    });
  }

  async function reorderExercises(dayId: string, ids: string[]) {
    if (!program) return;
    setProgram({
      ...program,
      days: program.days.map((d) =>
        d.id !== dayId
          ? d
          : {
              ...d,
              exercises: ids
                .map((id, i) => {
                  const ex = d.exercises.find((e) => e.id === id);
                  return ex ? { ...ex, sortOrder: i } : null;
                })
                .filter((e): e is WorkoutExerciseDto => e != null),
            },
      ),
    });
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch(
        `/workouts/${program.id}/days/${dayId}/exercises/reorder`,
        token,
        { method: "PUT", body: JSON.stringify({ ids }) },
      );
      await refreshProgram(program.id);
    });
  }

  async function moveExercise(
    dayId: string,
    exerciseId: string,
    targetDayId: string,
  ) {
    if (!program) return;
    await withBusy(async () => {
      const token = await getToken();
      await browserApiFetch(
        `/workouts/${program.id}/days/${dayId}/exercises/${exerciseId}/move`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ targetDayId }),
        },
      );
      await refreshProgram(program.id);
    });
  }

  async function generate() {
    if (!program) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await browserApiFetch<WorkoutProgramDto>(
        `/workouts/${program.id}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "ACTIVE" }),
        },
      );
      router.push(`/workouts/${updated.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generateFailed"));
      setBusy(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("title")}
        </h1>
        <WizardProgress step={step} />
      </div>

      {step === 1 ? (
        <StepClient
          selectedId={clientId}
          selectedName={clientName}
          locked={program !== null || Boolean(initialClientId)}
          onSelect={({ id, name }) => {
            if (program || initialClientId) return;
            setClientId(id);
            setClientName(name);
          }}
          onContinue={() => {
            setError(null);
            setStep(2);
          }}
        />
      ) : null}

      {step === 2 && clientId && clientName ? (
        <StepProgram
          clientName={clientName}
          defaultValues={
            program
              ? {
                  name: program.name,
                  goal: program.goal,
                  startDate: program.startDate,
                  endDate: program.endDate,
                  daysPerWeek: program.daysPerWeek,
                  level: program.level,
                  location: program.location,
                  equipment: program.equipment,
                  observations: program.observations,
                }
              : undefined
          }
          submitting={busy}
          error={error}
          onBack={() => {
            setError(null);
            setStep(1);
          }}
          onSubmit={createDraft}
        />
      ) : null}

      {step === 3 && program ? (
        <StepDays
          days={program.days}
          daysPerWeek={program.daysPerWeek}
          busy={busy}
          error={error}
          onBack={() => {
            setError(null);
            setStep(2);
          }}
          onContinue={() => {
            setError(null);
            setStep(4);
          }}
          onAddDay={addDay}
          onUpdateDay={updateDay}
          onRemoveDay={removeDay}
          onDuplicateDay={duplicateDay}
          onReorderDays={reorderDays}
          onSeedDays={seedDays}
        />
      ) : null}

      {step === 4 && program ? (
        <StepExercises
          days={program.days}
          busy={busy}
          error={error}
          onBack={() => {
            setError(null);
            setStep(3);
          }}
          onContinue={() => {
            setError(null);
            setStep(5);
          }}
          onAddExercise={addExercise}
          onRemoveExercise={removeExercise}
          onDuplicateExercise={duplicateExercise}
          onReorderExercises={reorderExercises}
          onMoveExercise={moveExercise}
        />
      ) : null}

      {step === 5 && program && clientName ? (
        <StepReview
          program={program}
          clientName={clientName}
          busy={busy}
          error={error}
          onBack={() => {
            setError(null);
            setStep(4);
          }}
          onGenerate={generate}
        />
      ) : null}
    </section>
  );
}
