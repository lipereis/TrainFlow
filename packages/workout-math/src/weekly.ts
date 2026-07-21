import { estimateDayDurationMin } from "./duration";
import { exerciseVolume, sumNullable } from "./volume";

export interface ExerciseCalcInput {
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number | null;
  restSec?: number | null;
  muscleGroup?: string;
}

export interface DayTotals {
  exerciseCount: number;
  totalSets: number;
  minReps: number;
  maxReps: number;
  minVolume: number | null;
  maxVolume: number | null;
  estimatedDurationMin: number;
}

export interface WeeklySummary {
  sessions: number;
  totalSets: number;
  minVolume: number | null;
  maxVolume: number | null;
  estimatedDurationMin: number;
  setsByMuscle: Record<string, number>;
}

export function dayTotals(exercises: ExerciseCalcInput[]): DayTotals {
  const volumes = exercises.map((exercise) => exerciseVolume(exercise));

  const setsByMuscle: Record<string, number> = {};
  let totalSets = 0;

  for (const exercise of exercises) {
    totalSets += exercise.sets;
    if (exercise.muscleGroup) {
      setsByMuscle[exercise.muscleGroup] =
        (setsByMuscle[exercise.muscleGroup] ?? 0) + exercise.sets;
    }
  }

  return {
    exerciseCount: exercises.length,
    totalSets,
    minReps: volumes.reduce((sum, volume) => sum + volume.minReps, 0),
    maxReps: volumes.reduce((sum, volume) => sum + volume.maxReps, 0),
    minVolume: sumNullable(volumes.map((volume) => volume.minVolume)),
    maxVolume: sumNullable(volumes.map((volume) => volume.maxVolume)),
    estimatedDurationMin: estimateDayDurationMin(exercises),
  };
}

export function weeklySummary(
  days: { exercises: ExerciseCalcInput[] }[],
): WeeklySummary {
  const dayResults = days.map((day) => dayTotals(day.exercises));
  const setsByMuscle: Record<string, number> = {};

  for (const day of days) {
    for (const exercise of day.exercises) {
      if (exercise.muscleGroup) {
        setsByMuscle[exercise.muscleGroup] =
          (setsByMuscle[exercise.muscleGroup] ?? 0) + exercise.sets;
      }
    }
  }

  return {
    sessions: days.length,
    totalSets: dayResults.reduce((sum, day) => sum + day.totalSets, 0),
    minVolume: sumNullable(dayResults.map((day) => day.minVolume)),
    maxVolume: sumNullable(dayResults.map((day) => day.maxVolume)),
    estimatedDurationMin: dayResults.reduce(
      (sum, day) => sum + day.estimatedDurationMin,
      0,
    ),
    setsByMuscle,
  };
}
