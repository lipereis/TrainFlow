import { z } from "zod";

export const inviteClientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;

export const clientStatusSchema = z.enum(["PENDING", "ACTIVE", "INACTIVE"]);

export const experienceLevelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

const clientProfileFields = {
  phone: z.string().trim().max(50).optional().nullable(),
  birthDate: z.string().min(1).optional().nullable(),
  heightCm: z.number().positive().max(300).optional().nullable(),
  weightKg: z.number().positive().max(500).optional().nullable(),
  goal: z.string().trim().max(500).optional().nullable(),
  experienceLevel: experienceLevelSchema.optional().nullable(),
  weeklyAvailability: z.string().trim().max(500).optional().nullable(),
  injuries: z.string().trim().max(2000).optional().nullable(),
  restrictions: z.string().trim().max(2000).optional().nullable(),
  equipment: z.string().trim().max(2000).optional().nullable(),
  observations: z.string().trim().max(5000).optional().nullable(),
};

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  status: clientStatusSchema.optional(),
  ...clientProfileFields,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientDtoSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid(),
  clerkUserId: z.string().nullable(),
  name: z.string(),
  email: z.string().email(),
  status: clientStatusSchema,
  phone: z.string().nullable(),
  birthDate: z.string().nullable(),
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
  goal: z.string().nullable(),
  experienceLevel: experienceLevelSchema.nullable(),
  weeklyAvailability: z.string().nullable(),
  injuries: z.string().nullable(),
  restrictions: z.string().nullable(),
  equipment: z.string().nullable(),
  observations: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ClientDto = z.infer<typeof clientDtoSchema>;
