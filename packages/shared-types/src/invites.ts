import { z } from "zod";

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
