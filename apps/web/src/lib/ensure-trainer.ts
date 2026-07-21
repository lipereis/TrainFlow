import { clerkClient } from "@clerk/nextjs/server";

/** Ensure signed-in user has publicMetadata.role=TRAINER (Foundation default). */
export async function ensureTrainerRole(userId: string): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (role === "TRAINER" || role === "CLIENT") return;

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...(user.publicMetadata as Record<string, unknown>),
      role: "TRAINER",
    },
  });
}
