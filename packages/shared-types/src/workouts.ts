import { z } from "zod";
import { experienceLevelSchema } from "./clients";

export const programStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const weightUnitSchema = z.enum(["KG", "LB"]);

export const EXECUTION_METHODS = [
  "Standard sets",
  "Superset",
  "Bi-set",
  "Tri-set",
  "Giant set",
  "Drop set",
  "Rest-pause",
  "Custom",
] as const;

export const executionMethodEnum = z.enum(EXECUTION_METHODS);

const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().min(0);
const nonNegativeNumber = z.number().min(0);

function validateWorkoutExercise(
  data: {
    exerciseId?: string | null;
    customName?: string | null;
    repsMin: number;
    repsMax: number;
  },
  ctx: z.RefinementCtx,
) {
  if (data.repsMin > data.repsMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "repsMin must be less than or equal to repsMax",
      path: ["repsMax"],
    });
  }

  if (!data.exerciseId && !data.customName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either exerciseId or customName is required",
      path: ["customName"],
    });
  }
}

function validateDateRange(
  data: { startDate?: string; endDate?: string | null },
  ctx: z.RefinementCtx,
) {
  if (!data.startDate || !data.endDate) {
    return;
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return;
  }

  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
}

export const workoutExerciseSchema = z
  .object({
    id: z.string().uuid().optional(),
    exerciseId: z.string().uuid().optional().nullable(),
    customName: z.string().trim().max(200).optional().nullable(),
    muscleGroup: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(100),
    sets: positiveInt,
    repsMin: positiveInt,
    repsMax: positiveInt,
    weight: nonNegativeNumber.optional().nullable(),
    weightUnit: weightUnitSchema.optional(),
    restSec: nonNegativeInt.optional().nullable(),
    tempo: z.string().trim().max(50).optional().nullable(),
    rpe: z.number().min(1).max(10).optional().nullable(),
    rir: nonNegativeNumber.optional().nullable(),
    method: executionMethodEnum.optional(),
    sortOrder: nonNegativeInt.optional(),
    observation: z.string().trim().max(2000).optional().nullable(),
    videoUrl: z.string().trim().url().max(500).optional().nullable(),
    alternativeText: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine(validateWorkoutExercise);

export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;

export const workoutDaySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  focus: z.string().trim().max(200).optional().nullable(),
  estimatedDurationMin: nonNegativeInt.optional().nullable(),
  warmup: z.string().trim().max(2000).optional().nullable(),
  cooldown: z.string().trim().max(2000).optional().nullable(),
  observations: z.string().trim().max(5000).optional().nullable(),
  sortOrder: nonNegativeInt.optional(),
  exercises: z.array(workoutExerciseSchema).optional(),
});

export type WorkoutDayInput = z.infer<typeof workoutDaySchema>;

const workoutProgramFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  goal: z.string().trim().max(500).optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1).optional().nullable(),
  daysPerWeek: z.number().int().min(1).max(7),
  level: experienceLevelSchema.optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  equipment: z.string().trim().max(1000).optional().nullable(),
  observations: z.string().trim().max(5000).optional().nullable(),
  status: programStatusSchema.optional(),
});

export const createWorkoutSchema = workoutProgramFieldsSchema
  .extend({
    clientId: z.string().uuid(),
    days: z.array(workoutDaySchema).optional(),
  })
  .superRefine(validateDateRange);

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export const updateWorkoutSchema = workoutProgramFieldsSchema
  .partial()
  .extend({
    days: z.array(workoutDaySchema).optional(),
  })
  .superRefine(validateDateRange);

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
