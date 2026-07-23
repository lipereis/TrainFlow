import { buttonClassName } from "@/components/ui/button";

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

/** English day names persisted to the API (not localized). */
export function dayLetterName(index: number): string {
  return `Day ${DAY_LETTERS[index] ?? index + 1}`;
}

export function exerciseDisplayName(
  ex: WorkoutExerciseDto,
  fallback = "Exercise",
): string {
  return ex.customName?.trim() || fallback;
}

const MUSCLE_LABEL_KEYS: Record<string, string> = {
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

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  Compound: "categoryCompound",
  Isolation: "categoryIsolation",
  Isometric: "categoryIsometric",
  Cardio: "categoryCardio",
};

export function translateMuscleLabel(
  value: string,
  t: (key: string) => string,
): string {
  const key = MUSCLE_LABEL_KEYS[value];
  return key ? t(key) : value;
}

export function translateCategoryLabel(
  value: string,
  t: (key: string) => string,
): string {
  const key = CATEGORY_LABEL_KEYS[value];
  return key ? t(key) : value;
}

export const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
export const labelClass = "block space-y-1 text-sm text-foreground";
export const btnPrimary = buttonClassName("primary", "sm");
export const btnSecondary = buttonClassName("secondary", "sm");
