import { notFound, forbidden } from "./errors";

import type { CreateExerciseInput, ExerciseDto } from "@trainflow/shared-types";
import { prisma } from "./prisma";

type ExerciseRow = {
  id: string;
  trainerId: string | null;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: string;
  equipment: string;
  defaultInstructions: string;
  videoUrl: string | null;
  alternativeIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ListExercisesQuery = {
  q?: string;
  muscle?: string;
  category?: string;
};

export class ExercisesService {

  private toDto(row: ExerciseRow): ExerciseDto {
    return {
      id: row.id,
      trainerId: row.trainerId,
      name: row.name,
      primaryMuscle: row.primaryMuscle,
      secondaryMuscles: row.secondaryMuscles,
      category: row.category,
      equipment: row.equipment,
      defaultInstructions: row.defaultInstructions,
      videoUrl: row.videoUrl,
      alternativeIds: row.alternativeIds,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async requireOwnedCustom(
    trainerId: string,
    exerciseId: string,
  ): Promise<ExerciseRow> {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw notFound("EXERCISE_NOT_FOUND", "Exercise not found");
    }
    if (exercise.trainerId === null) {
      throw forbidden("FORBIDDEN", "Global exercises cannot be modified");
    }
    if (exercise.trainerId !== trainerId) {
      throw forbidden("FORBIDDEN_CROSS_TENANT", "Exercise not found for this trainer");
    }
    return exercise as ExerciseRow;
  }

  async list(
    trainerId: string,
    query: ListExercisesQuery = {},
  ): Promise<ExerciseDto[]> {
    const q = query.q?.trim();
    const muscle = query.muscle?.trim();
    const category = query.category?.trim();

    const rows = await prisma.exercise.findMany({
      where: {
        OR: [{ trainerId: null }, { trainerId }],
        ...(q
          ? { name: { contains: q, mode: "insensitive" as const } }
          : {}),
        ...(muscle
          ? { primaryMuscle: { equals: muscle, mode: "insensitive" as const } }
          : {}),
        ...(category
          ? { category: { equals: category, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: [{ name: "asc" }],
    });

    return rows.map((r) => this.toDto(r as ExerciseRow));
  }

  async create(
    trainerId: string,
    input: CreateExerciseInput,
  ): Promise<ExerciseDto> {
    const row = await prisma.exercise.create({
      data: {
        trainerId,
        name: input.name,
        primaryMuscle: input.primaryMuscle,
        secondaryMuscles: input.secondaryMuscles ?? [],
        category: input.category,
        equipment: input.equipment,
        defaultInstructions: input.defaultInstructions ?? "",
        videoUrl: input.videoUrl ?? null,
        alternativeIds: input.alternativeIds ?? [],
      },
    });
    return this.toDto(row as ExerciseRow);
  }

  async update(
    trainerId: string,
    exerciseId: string,
    input: Partial<CreateExerciseInput>,
  ): Promise<ExerciseDto> {
    await this.requireOwnedCustom(trainerId, exerciseId);
    const row = await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.primaryMuscle !== undefined
          ? { primaryMuscle: input.primaryMuscle }
          : {}),
        ...(input.secondaryMuscles !== undefined
          ? { secondaryMuscles: input.secondaryMuscles }
          : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.equipment !== undefined
          ? { equipment: input.equipment }
          : {}),
        ...(input.defaultInstructions !== undefined
          ? { defaultInstructions: input.defaultInstructions }
          : {}),
        ...(input.videoUrl !== undefined ? { videoUrl: input.videoUrl } : {}),
        ...(input.alternativeIds !== undefined
          ? { alternativeIds: input.alternativeIds }
          : {}),
      },
    });
    return this.toDto(row as ExerciseRow);
  }

  async remove(trainerId: string, exerciseId: string): Promise<void> {
    await this.requireOwnedCustom(trainerId, exerciseId);
    await prisma.exercise.delete({ where: { id: exerciseId } });
  }
}

export const exercisesService = new ExercisesService();
