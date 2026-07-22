import { auth } from "@clerk/nextjs/server";
import type { Role } from "@trainflow/shared-types";
import { requireClientId, requireTrainerId } from "@/server/auth";
import { forbidden, notFound, unauthorized } from "@/server/errors";
import { prisma } from "@/server/prisma";
import { workoutsService } from "@/server/workouts.service";

function roleFromMeta(meta: unknown): Role | null {
  const role = (meta as { role?: string } | null | undefined)?.role;
  if (role === "TRAINER" || role === "CLIENT") return role;
  return null;
}

export type ExportProgramRow = {
  id: string;
  trainerId: string;
  clientId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export function trainerIdForClientExport(
  program: ExportProgramRow | null,
  clientId: string,
): string {
  if (!program) {
    throw notFound("WORKOUT_NOT_FOUND", "Workout program not found");
  }
  if (program.clientId !== clientId || program.status !== "ACTIVE") {
    throw forbidden("FORBIDDEN", "Workout not available for export");
  }
  return program.trainerId;
}

/**
 * Authorize PDF/XLSX export for the current session.
 * Trainer: must own the program. Client: must own it and status ACTIVE.
 */
export async function authorizeWorkoutExport(
  programId: string,
): Promise<{ trainerId: string }> {
  const session = await auth();
  if (!session.userId) {
    throw unauthorized("UNAUTHORIZED", "Missing session");
  }

  const claims = session.sessionClaims as Record<string, unknown> | null;
  const role =
    roleFromMeta(claims?.metadata) ?? roleFromMeta(claims?.publicMetadata);

  if (role === "CLIENT") {
    const { clientId } = await requireClientId();
    const program = await prisma.workoutProgram.findUnique({
      where: { id: programId },
      select: {
        id: true,
        trainerId: true,
        clientId: true,
        status: true,
      },
    });
    const trainerId = trainerIdForClientExport(
      program as ExportProgramRow | null,
      clientId,
    );
    return { trainerId };
  }

  // Default / TRAINER path (also covers trainers whose claim role is TRAINER)
  const { trainerId } = await requireTrainerId();
  await workoutsService.get(trainerId, programId);
  return { trainerId };
}
