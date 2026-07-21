import { z } from "zod";

export const createTemplateFromWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
});

export type CreateTemplateFromWorkoutInput = z.infer<
  typeof createTemplateFromWorkoutSchema
>;

export const createWorkoutFromTemplateSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1).max(200).optional(),
});

export type CreateWorkoutFromTemplateInput = z.infer<
  typeof createWorkoutFromTemplateSchema
>;
