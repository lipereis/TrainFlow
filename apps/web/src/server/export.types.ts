export type ExportExercise = {
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
  observation: string | null;
  alternativeText: string | null;
};

export type ExportDay = {
  name: string;
  focus: string | null;
  estimatedDurationMin: number | null;
  warmup: string | null;
  cooldown: string | null;
  observations: string | null;
  exercises: ExportExercise[];
};

export type ExportProgram = {
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
  level: string | null;
  location: string | null;
  equipment: string | null;
  observations: string | null;
  status: string;
  days: ExportDay[];
};

export type ExportPayload = {
  trainerName: string;
  clientName: string;
  clientObservations: string | null;
  program: ExportProgram;
  generatedAt?: Date;
};
