import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import type { Role } from "@trainflow/shared-types";
import { prisma } from "./prisma";
import { unauthorized, forbidden } from "./errors";
import { trainersService } from "./trainers.service";

function roleFromMeta(meta: unknown): Role | null {
  const role = (meta as { role?: string } | null | undefined)?.role;
  if (role === "TRAINER" || role === "CLIENT") return role;
  return null;
}

/** Resolve authenticated TRAINER and ensure Trainer row exists. */
export async function requireTrainerId(): Promise<{
  clerkUserId: string;
  trainerId: string;
  role: Role;
}> {
  const session = await auth();
  if (!session.userId) {
    throw unauthorized("UNAUTHORIZED", "Missing session");
  }

  const claims = session.sessionClaims as Record<string, unknown> | null;
  let role =
    roleFromMeta(claims?.metadata) ?? roleFromMeta(claims?.publicMetadata);

  if (!role) {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    const user = await clerk.users.getUser(session.userId);
    role = roleFromMeta(user.publicMetadata);
    if (!role) {
      await clerk.users.updateUserMetadata(session.userId, {
        publicMetadata: {
          ...(user.publicMetadata as Record<string, unknown>),
          role: "TRAINER",
        },
      });
      role = "TRAINER";
    }
  }

  if (role !== "TRAINER") {
    throw forbidden("FORBIDDEN", "Insufficient role");
  }

  let trainer = await trainersService.findByClerkUserId(session.userId);
  if (!trainer) {
    const user = await currentUser();
    const email =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw unauthorized("UNAUTHORIZED", "Trainer email missing");
    }
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email;
    trainer = await trainersService.createFromClerk({
      clerkUserId: session.userId,
      name,
      email,
    });
  }

  return { clerkUserId: session.userId, trainerId: trainer.id, role };
}

/** Resolve authenticated CLIENT and ensure Client row is linked. */
export async function requireClientId(): Promise<{
  clerkUserId: string;
  clientId: string;
  role: Role;
}> {
  const session = await auth();
  if (!session.userId) {
    throw unauthorized("UNAUTHORIZED", "Missing session");
  }

  const claims = session.sessionClaims as Record<string, unknown> | null;
  let role =
    roleFromMeta(claims?.metadata) ?? roleFromMeta(claims?.publicMetadata);

  if (!role) {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    const user = await clerk.users.getUser(session.userId);
    role = roleFromMeta(user.publicMetadata);
  }

  if (role !== "CLIENT") {
    throw forbidden("FORBIDDEN", "Insufficient role");
  }

  const client = await prisma.client.findUnique({
    where: { clerkUserId: session.userId },
  });
  if (!client) {
    throw unauthorized("UNAUTHORIZED", "Client profile not linked");
  }

  return { clerkUserId: session.userId, clientId: client.id, role };
}
