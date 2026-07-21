export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type WorkoutExerciseDto = {
  id: string;
  dayId: string;
  exerciseId: string | null;
  customName: string | null;
  muscleGroup: string;
  category: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number | null;
  weightUnit: "KG" | "LB";
  restSec: number | null;
  tempo: string | null;
  rpe: number | null;
  rir: number | null;
  method: string;
  sortOrder: number;
  observation: string | null;
  videoUrl: string | null;
  alternativeText: string | null;
};

export type WorkoutDayDto = {
  id: string;
  programId: string;
  name: string;
  focus: string | null;
  estimatedDurationMin: number | null;
  warmup: string | null;
  cooldown: string | null;
  observations: string | null;
  sortOrder: number;
  exercises: WorkoutExerciseDto[];
};

export type WorkoutProgramDto = {
  id: string;
  trainerId: string;
  clientId: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  location: string | null;
  equipment: string | null;
  observations: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  days: WorkoutDayDto[];
};

export const DAY_LETTERS = ["A", "B", "C", "D", "E", "F", "G"] as const;

export function dayLetterName(index: number): string {
  return `Day ${DAY_LETTERS[index] ?? index + 1}`;
}

export function exerciseDisplayName(ex: WorkoutExerciseDto): string {
  return ex.customName?.trim() || "Exercise";
}

export const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-50";
export const labelClass = "block space-y-1 text-sm";
export const btnPrimary =
  "rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50";
export const btnSecondary =
  "rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 disabled:opacity-50";
