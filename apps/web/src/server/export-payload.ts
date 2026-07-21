import type { ExportPayload } from "@/server/export.types";
import { prisma } from "@/server/prisma";
import { workoutsService } from "@/server/workouts.service";

export async function loadExportPayload(
  trainerId: string,
  programId: string,
): Promise<ExportPayload> {
  const program = await workoutsService.get(trainerId, programId);
  const [trainer, client] = await Promise.all([
    prisma.trainer.findUnique({ where: { id: trainerId } }),
    prisma.client.findUnique({ where: { id: program.clientId } }),
  ]);

  return {
    trainerName: trainer?.name ?? "Trainer",
    clientName: client?.name ?? "Client",
    clientObservations: client?.observations ?? null,
    program: {
      name: program.name,
      goal: program.goal,
      startDate: program.startDate,
      endDate: program.endDate,
      daysPerWeek: program.daysPerWeek,
      level: program.level,
      location: program.location,
      equipment: program.equipment,
      observations: program.observations,
      status: program.status,
      days: program.days.map((d) => ({
        name: d.name,
        focus: d.focus,
        estimatedDurationMin: d.estimatedDurationMin,
        warmup: d.warmup,
        cooldown: d.cooldown,
        observations: d.observations,
        exercises: d.exercises.map((e) => ({
          customName: e.customName,
          muscleGroup: e.muscleGroup,
          category: e.category,
          sets: e.sets,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          weight: e.weight,
          weightUnit: e.weightUnit,
          restSec: e.restSec,
          tempo: e.tempo,
          rpe: e.rpe,
          rir: e.rir,
          method: e.method,
          observation: e.observation,
          alternativeText: e.alternativeText,
        })),
      })),
    },
    generatedAt: new Date(),
  };
}
