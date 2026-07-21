export interface ExerciseDurationInput {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec?: number | null;
}

export interface DurationOptions {
  secondsPerRep?: number;
  transitionSec?: number;
}

export function estimateDayDurationMin(
  exercises: ExerciseDurationInput[],
  opts?: DurationOptions,
): number {
  const secondsPerRep = opts?.secondsPerRep ?? 3;
  const transitionSec = opts?.transitionSec ?? 30;

  let totalSec = 0;

  for (const exercise of exercises) {
    const avgReps = (exercise.repsMin + exercise.repsMax) / 2;
    const workSec = exercise.sets * avgReps * secondsPerRep;
    const restSec = exercise.restSec ?? 0;
    const restTotalSec = Math.max(exercise.sets - 1, 0) * restSec;
    totalSec += workSec + restTotalSec;
  }

  const transitionTotalSec =
    Math.max(exercises.length - 1, 0) * transitionSec;
  totalSec += transitionTotalSec;

  return Math.round(totalSec / 60);
}
