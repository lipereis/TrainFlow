export interface ExerciseVolumeInput {
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number | null;
}

export interface ExerciseVolumeResult {
  minReps: number;
  maxReps: number;
  minVolume: number | null;
  maxVolume: number | null;
}

export function exerciseVolume(
  input: ExerciseVolumeInput,
): ExerciseVolumeResult {
  const { sets, repsMin, repsMax, weight } = input;
  const minReps = sets * repsMin;
  const maxReps = sets * repsMax;

  if (weight === null) {
    return { minReps, maxReps, minVolume: null, maxVolume: null };
  }

  return {
    minReps,
    maxReps,
    minVolume: sets * repsMin * weight,
    maxVolume: sets * repsMax * weight,
  };
}

export function sumNullable(values: (number | null)[]): number | null {
  const available = values.filter((v): v is number => v !== null);
  if (available.length === 0) {
    return null;
  }
  return available.reduce((sum, value) => sum + value, 0);
}
