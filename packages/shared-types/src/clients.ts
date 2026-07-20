import { z } from "zod";

export const inviteClientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;

export const clientStatusSchema = z.enum(["PENDING", "ACTIVE", "INACTIVE"]);

export const clientDtoSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid(),
  clerkUserId: z.string().nullable(),
  name: z.string(),
  email: z.string().email(),
  status: clientStatusSchema,
  createdAt: z.string(),
});

export type ClientDto = z.infer<typeof clientDtoSchema>;
