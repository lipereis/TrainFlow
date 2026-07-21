import { z } from "zod";

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  primaryMuscle: z.string().trim().min(1).max(100),
  secondaryMuscles: z.array(z.string().trim().min(1).max(100)).default([]),
  category: z.string().trim().min(1).max(100),
  equipment: z.string().trim().min(1).max(100),
  defaultInstructions: z.string().trim().max(5000).default(""),
  videoUrl: z.string().trim().url().max(500).optional().nullable(),
  alternativeIds: z.array(z.string().uuid()).default([]),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export const exerciseDtoSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid().nullable(),
  name: z.string(),
  primaryMuscle: z.string(),
  secondaryMuscles: z.array(z.string()),
  category: z.string(),
  equipment: z.string(),
  defaultInstructions: z.string(),
  videoUrl: z.string().nullable(),
  alternativeIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExerciseDto = z.infer<typeof exerciseDtoSchema>;
