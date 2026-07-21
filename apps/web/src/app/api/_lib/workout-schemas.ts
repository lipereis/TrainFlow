import { z } from "zod";
import { executionMethodEnum, workoutDaySchema } from "@trainflow/shared-types";

export const updateDaySchema = workoutDaySchema
  .omit({ exercises: true, id: true })
  .partial();

export const updateExerciseSchema = z.object({
  exerciseId: z.string().uuid().optional().nullable(),
  customName: z.string().trim().max(200).optional().nullable(),
  muscleGroup: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  sets: z.number().int().positive().optional(),
  repsMin: z.number().int().positive().optional(),
  repsMax: z.number().int().positive().optional(),
  weight: z.number().min(0).optional().nullable(),
  weightUnit: z.enum(["KG", "LB"]).optional(),
  restSec: z.number().int().min(0).optional().nullable(),
  tempo: z.string().trim().max(50).optional().nullable(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  rir: z.number().min(0).optional().nullable(),
  method: executionMethodEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
  observation: z.string().trim().max(2000).optional().nullable(),
  videoUrl: z.string().trim().url().max(500).optional().nullable(),
  alternativeText: z.string().trim().max(500).optional().nullable(),
});

export const moveExerciseSchema = z.object({
  targetDayId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
});

/** Accept shared-types `ids` or plan alias `orderedIds`. */
export const reorderBodySchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).optional(),
    orderedIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .transform((v, ctx) => {
    const ids = v.ids ?? v.orderedIds;
    if (!ids || ids.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ids or orderedIds required",
      });
      return z.NEVER;
    }
    return { ids };
  });
