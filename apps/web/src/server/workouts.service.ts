import { notFound, forbidden, badRequest } from "./errors";

import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  WorkoutDayInput,
  WorkoutExerciseInput,
} from "@trainflow/shared-types";
import { dayTotals, weeklySummary } from "@trainflow/workout-math";
import { prisma } from "./prisma";

type ProgramStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type WeightUnit = "KG" | "LB";

type ExerciseRow = {
  id: string;
  dayId: string;
  exerciseId: string | null;
  customName: string | null;
  muscleGroup: string;
  category: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number | null;
  weightUnit: WeightUnit;
  restSec: number | null;
  tempo: string | null;
  rpe: number | null;
  rir: number | null;
  method: string;
  sortOrder: number;
  observation: string | null;
  videoUrl: string | null;
  alternativeText: string | null;
};

type DayRow = {
  id: string;
  programId: string;
  name: string;
  focus: string | null;
  estimatedDurationMin: number | null;
  warmup: string | null;
  cooldown: string | null;
  observations: string | null;
  sortOrder: number;
  exercises?: ExerciseRow[];
};

type ProgramRow = {
  id: string;
  trainerId: string;
  clientId: string;
  name: string;
  goal: string | null;
  startDate: Date;
  endDate: Date | null;
  daysPerWeek: number;
  level: ExperienceLevel | null;
  location: string | null;
  equipment: string | null;
  observations: string | null;
  status: ProgramStatus;
  createdAt: Date;
  updatedAt: Date;
  days?: DayRow[];
};

const nestedInclude = {
  days: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      exercises: { orderBy: { sortOrder: "asc" as const } },
    },
  },
};

export class WorkoutsService {

  private toExerciseDto(row: ExerciseRow) {
    return {
      id: row.id,
      dayId: row.dayId,
      exerciseId: row.exerciseId,
      customName: row.customName,
      muscleGroup: row.muscleGroup,
      category: row.category,
      sets: row.sets,
      repsMin: row.repsMin,
      repsMax: row.repsMax,
      weight: row.weight,
      weightUnit: row.weightUnit,
      restSec: row.restSec,
      tempo: row.tempo,
      rpe: row.rpe,
      rir: row.rir,
      method: row.method,
      sortOrder: row.sortOrder,
      observation: row.observation,
      videoUrl: row.videoUrl,
      alternativeText: row.alternativeText,
    };
  }

  private toDayDto(row: DayRow) {
    const exercises = (row.exercises ?? []).map((e) => this.toExerciseDto(e));
    return {
      id: row.id,
      programId: row.programId,
      name: row.name,
      focus: row.focus,
      estimatedDurationMin: row.estimatedDurationMin,
      warmup: row.warmup,
      cooldown: row.cooldown,
      observations: row.observations,
      sortOrder: row.sortOrder,
      exercises,
      totals: dayTotals(
        exercises.map((e) => ({
          sets: e.sets,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          weight: e.weight,
          restSec: e.restSec,
          muscleGroup: e.muscleGroup,
        })),
      ),
    };
  }

  private toProgramListDto(row: ProgramRow) {
    return {
      id: row.id,
      trainerId: row.trainerId,
      clientId: row.clientId,
      name: row.name,
      goal: row.goal,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate?.toISOString() ?? null,
      daysPerWeek: row.daysPerWeek,
      level: row.level,
      location: row.location,
      equipment: row.equipment,
      observations: row.observations,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toProgramDto(row: ProgramRow) {
    const days = (row.days ?? []).map((d) => this.toDayDto(d));
    return {
      ...this.toProgramListDto(row),
      days,
      summary: weeklySummary(
        days.map((d) => ({
          exercises: d.exercises.map((e) => ({
            sets: e.sets,
            repsMin: e.repsMin,
            repsMax: e.repsMax,
            weight: e.weight,
            restSec: e.restSec,
            muscleGroup: e.muscleGroup,
          })),
        })),
      ),
    };
  }

  private exerciseCreateData(
    input: WorkoutExerciseInput,
    sortOrder: number,
  ) {
    return {
      exerciseId: input.exerciseId ?? null,
      customName: input.customName ?? null,
      muscleGroup: input.muscleGroup,
      category: input.category,
      sets: input.sets,
      repsMin: input.repsMin,
      repsMax: input.repsMax,
      weight: input.weight ?? null,
      weightUnit: input.weightUnit ?? "KG",
      restSec: input.restSec ?? null,
      tempo: input.tempo ?? null,
      rpe: input.rpe ?? null,
      rir: input.rir ?? null,
      method: input.method ?? "Standard sets",
      sortOrder: input.sortOrder ?? sortOrder,
      observation: input.observation ?? null,
      videoUrl: input.videoUrl ?? null,
      alternativeText: input.alternativeText ?? null,
    };
  }

  private dayCreateData(input: WorkoutDayInput, sortOrder: number) {
    const exercises = input.exercises ?? [];
    return {
      name: input.name,
      focus: input.focus ?? null,
      estimatedDurationMin: input.estimatedDurationMin ?? null,
      warmup: input.warmup ?? null,
      cooldown: input.cooldown ?? null,
      observations: input.observations ?? null,
      sortOrder: input.sortOrder ?? sortOrder,
      exercises: {
        create: exercises.map((ex, j) => this.exerciseCreateData(ex, j)),
      },
    };
  }

  private async requireOwnedClient(trainerId: string, clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw notFound("CLIENT_NOT_FOUND", "Client not found");
    }
    if (client.trainerId !== trainerId) {
      throw forbidden("FORBIDDEN_CROSS_TENANT", "Client not found for this trainer");
    }
    return client;
  }

  private async requireOwnedProgram(
    trainerId: string,
    programId: string,
    includeNested = false,
  ): Promise<ProgramRow> {
    const program = await prisma.workoutProgram.findUnique({
      where: { id: programId },
      ...(includeNested ? { include: nestedInclude } : {}),
    });
    if (!program) {
      throw notFound("WORKOUT_NOT_FOUND", "Workout program not found");
    }
    if (program.trainerId !== trainerId) {
      throw forbidden("FORBIDDEN_CROSS_TENANT", "Workout not found for this trainer");
    }
    return program as ProgramRow;
  }

  private async requireDayInProgram(
    trainerId: string,
    programId: string,
    dayId: string,
  ): Promise<DayRow> {
    await this.requireOwnedProgram(trainerId, programId);
    const day = await prisma.workoutDay.findUnique({
      where: { id: dayId },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });
    if (!day || day.programId !== programId) {
      throw notFound("DAY_NOT_FOUND", "Workout day not found");
    }
    return day as DayRow;
  }

  private async requireExerciseInDay(
    trainerId: string,
    programId: string,
    dayId: string,
    exerciseId: string,
  ): Promise<ExerciseRow> {
    await this.requireDayInProgram(trainerId, programId, dayId);
    const exercise = await prisma.workoutExercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise || exercise.dayId !== dayId) {
      throw notFound("WORKOUT_EXERCISE_NOT_FOUND", "Workout exercise not found");
    }
    return exercise as ExerciseRow;
  }

  async create(trainerId: string, input: CreateWorkoutInput) {
    await this.requireOwnedClient(trainerId, input.clientId);
    const days = input.days ?? [];
    const row = await prisma.workoutProgram.create({
      data: {
        trainerId,
        clientId: input.clientId,
        name: input.name,
        goal: input.goal ?? null,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        daysPerWeek: input.daysPerWeek,
        level: input.level ?? null,
        location: input.location ?? null,
        equipment: input.equipment ?? null,
        observations: input.observations ?? null,
        status: "DRAFT",
        days: {
          create: days.map((day, i) => this.dayCreateData(day, i)),
        },
      },
      include: nestedInclude,
    });
    return this.toProgramDto(row as ProgramRow);
  }

  async list(trainerId: string, clientId?: string) {
    const rows = await prisma.workoutProgram.findMany({
      where: {
        trainerId,
        ...(clientId ? { clientId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
    });
    return rows.map((r) => this.toProgramListDto(r as ProgramRow));
  }

  async get(trainerId: string, programId: string) {
    const row = await this.requireOwnedProgram(trainerId, programId, true);
    return this.toProgramDto(row);
  }

  async update(
    trainerId: string,
    programId: string,
    input: UpdateWorkoutInput,
  ) {
    const existing = await this.requireOwnedProgram(trainerId, programId);

    if (input.startDate !== undefined || input.endDate !== undefined) {
      const start =
        input.startDate !== undefined
          ? new Date(input.startDate)
          : existing.startDate;
      const end =
        input.endDate !== undefined
          ? input.endDate
            ? new Date(input.endDate)
            : null
          : existing.endDate;
      if (end && end < start) {
        throw badRequest("VALIDATION_ERROR", "endDate must be on or after startDate");
      }
    }

    const row = await prisma.workoutProgram.update({
      where: { id: programId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.goal !== undefined ? { goal: input.goal } : {}),
        ...(input.startDate !== undefined
          ? { startDate: new Date(input.startDate) }
          : {}),
        ...(input.endDate !== undefined
          ? { endDate: input.endDate ? new Date(input.endDate) : null }
          : {}),
        ...(input.daysPerWeek !== undefined
          ? { daysPerWeek: input.daysPerWeek }
          : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.equipment !== undefined
          ? { equipment: input.equipment }
          : {}),
        ...(input.observations !== undefined
          ? { observations: input.observations }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: nestedInclude,
    });
    return this.toProgramDto(row as ProgramRow);
  }

  async remove(trainerId: string, programId: string): Promise<void> {
    await this.requireOwnedProgram(trainerId, programId);
    await prisma.workoutProgram.delete({ where: { id: programId } });
  }

  async addDay(trainerId: string, programId: string, input: WorkoutDayInput) {
    await this.requireOwnedProgram(trainerId, programId);
    const existing = await prisma.workoutDay.findMany({
      where: { programId },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const nextOrder =
      input.sortOrder ??
      (existing[0] ? existing[0].sortOrder + 1 : 0);
    const row = await prisma.workoutDay.create({
      data: {
        programId,
        ...this.dayCreateData({ ...input, sortOrder: nextOrder }, nextOrder),
      },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
      },
    });
    return this.toDayDto(row as DayRow);
  }

  async updateDay(
    trainerId: string,
    programId: string,
    dayId: string,
    input: Partial<WorkoutDayInput>,
  ) {
    await this.requireDayInProgram(trainerId, programId, dayId);
    const row = await prisma.workoutDay.update({
      where: { id: dayId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.focus !== undefined ? { focus: input.focus } : {}),
        ...(input.estimatedDurationMin !== undefined
          ? { estimatedDurationMin: input.estimatedDurationMin }
          : {}),
        ...(input.warmup !== undefined ? { warmup: input.warmup } : {}),
        ...(input.cooldown !== undefined ? { cooldown: input.cooldown } : {}),
        ...(input.observations !== undefined
          ? { observations: input.observations }
          : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
      },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
      },
    });
    return this.toDayDto(row as DayRow);
  }

  async removeDay(
    trainerId: string,
    programId: string,
    dayId: string,
  ): Promise<void> {
    await this.requireDayInProgram(trainerId, programId, dayId);
    await prisma.workoutDay.delete({ where: { id: dayId } });
  }

  async reorderDays(
    trainerId: string,
    programId: string,
    orderedIds: string[],
  ) {
    await this.requireOwnedProgram(trainerId, programId);
    const days = await prisma.workoutDay.findMany({
      where: { programId },
    });
    const idSet = new Set(days.map((d) => d.id));
    if (
      orderedIds.length !== days.length ||
      orderedIds.some((id) => !idSet.has(id))
    ) {
      throw notFound("DAY_NOT_FOUND", "Reorder ids must match all days in the program");
    }
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.workoutDay.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.get(trainerId, programId);
  }

  async addExercise(
    trainerId: string,
    programId: string,
    dayId: string,
    input: WorkoutExerciseInput,
  ) {
    await this.requireDayInProgram(trainerId, programId, dayId);
    const existing = await prisma.workoutExercise.findMany({
      where: { dayId },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const nextOrder =
      input.sortOrder ??
      (existing[0] ? existing[0].sortOrder + 1 : 0);
    const row = await prisma.workoutExercise.create({
      data: {
        dayId,
        ...this.exerciseCreateData(input, nextOrder),
      },
    });
    return this.toExerciseDto(row as ExerciseRow);
  }

  async updateExercise(
    trainerId: string,
    programId: string,
    dayId: string,
    exerciseId: string,
    input: Partial<WorkoutExerciseInput>,
  ) {
    const existing = await this.requireExerciseInDay(
      trainerId,
      programId,
      dayId,
      exerciseId,
    );

    const mergedExerciseId =
      input.exerciseId !== undefined ? input.exerciseId : existing.exerciseId;
    const mergedCustomName =
      input.customName !== undefined ? input.customName : existing.customName;
    const mergedRepsMin =
      input.repsMin !== undefined ? input.repsMin : existing.repsMin;
    const mergedRepsMax =
      input.repsMax !== undefined ? input.repsMax : existing.repsMax;

    if (mergedRepsMin > mergedRepsMax) {
      throw badRequest("VALIDATION_ERROR", "repsMin must be less than or equal to repsMax");
    }
    if (!mergedExerciseId && !mergedCustomName?.trim()) {
      throw badRequest("VALIDATION_ERROR", "Either exerciseId or customName is required");
    }

    const row = await prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: {
        ...(input.exerciseId !== undefined
          ? { exerciseId: input.exerciseId }
          : {}),
        ...(input.customName !== undefined
          ? { customName: input.customName }
          : {}),
        ...(input.muscleGroup !== undefined
          ? { muscleGroup: input.muscleGroup }
          : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.sets !== undefined ? { sets: input.sets } : {}),
        ...(input.repsMin !== undefined ? { repsMin: input.repsMin } : {}),
        ...(input.repsMax !== undefined ? { repsMax: input.repsMax } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.weightUnit !== undefined
          ? { weightUnit: input.weightUnit }
          : {}),
        ...(input.restSec !== undefined ? { restSec: input.restSec } : {}),
        ...(input.tempo !== undefined ? { tempo: input.tempo } : {}),
        ...(input.rpe !== undefined ? { rpe: input.rpe } : {}),
        ...(input.rir !== undefined ? { rir: input.rir } : {}),
        ...(input.method !== undefined ? { method: input.method } : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
        ...(input.observation !== undefined
          ? { observation: input.observation }
          : {}),
        ...(input.videoUrl !== undefined ? { videoUrl: input.videoUrl } : {}),
        ...(input.alternativeText !== undefined
          ? { alternativeText: input.alternativeText }
          : {}),
      },
    });
    return this.toExerciseDto(row as ExerciseRow);
  }

  async removeExercise(
    trainerId: string,
    programId: string,
    dayId: string,
    exerciseId: string,
  ): Promise<void> {
    await this.requireExerciseInDay(trainerId, programId, dayId, exerciseId);
    await prisma.workoutExercise.delete({ where: { id: exerciseId } });
  }

  async reorderExercises(
    trainerId: string,
    programId: string,
    dayId: string,
    orderedIds: string[],
  ) {
    await this.requireDayInProgram(trainerId, programId, dayId);
    const exercises = await prisma.workoutExercise.findMany({
      where: { dayId },
    });
    const idSet = new Set(exercises.map((e) => e.id));
    if (
      orderedIds.length !== exercises.length ||
      orderedIds.some((id) => !idSet.has(id))
    ) {
      throw notFound("WORKOUT_EXERCISE_NOT_FOUND", "Reorder ids must match all exercises in the day");
    }
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.workoutExercise.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.get(trainerId, programId);
  }

  async moveExercise(
    trainerId: string,
    programId: string,
    dayId: string,
    exerciseId: string,
    targetDayId: string,
    sortOrder?: number,
  ) {
    await this.requireExerciseInDay(trainerId, programId, dayId, exerciseId);
    await this.requireDayInProgram(trainerId, programId, targetDayId);

    const row = await prisma.$transaction(async (tx) => {
      const targetOthers = await tx.workoutExercise.findMany({
        where: { dayId: targetDayId, NOT: { id: exerciseId } },
        orderBy: { sortOrder: "asc" },
      });
      const insertAt =
        sortOrder === undefined
          ? targetOthers.length
          : Math.min(Math.max(0, sortOrder), targetOthers.length);

      const orderedTargetIds = [
        ...targetOthers.slice(0, insertAt).map((e) => e.id),
        exerciseId,
        ...targetOthers.slice(insertAt).map((e) => e.id),
      ];

      let moved: ExerciseRow | null = null;
      for (let i = 0; i < orderedTargetIds.length; i++) {
        const id = orderedTargetIds[i];
        const updated = await tx.workoutExercise.update({
          where: { id },
          data:
            id === exerciseId
              ? { dayId: targetDayId, sortOrder: i }
              : { sortOrder: i },
        });
        if (id === exerciseId) {
          moved = updated as ExerciseRow;
        }
      }

      if (dayId !== targetDayId) {
        const sourceRemaining = await tx.workoutExercise.findMany({
          where: { dayId },
          orderBy: { sortOrder: "asc" },
        });
        for (let i = 0; i < sourceRemaining.length; i++) {
          await tx.workoutExercise.update({
            where: { id: sourceRemaining[i].id },
            data: { sortOrder: i },
          });
        }
      }

      return moved!;
    });

    return this.toExerciseDto(row);
  }

  async duplicateProgram(trainerId: string, programId: string) {
    const source = await this.requireOwnedProgram(trainerId, programId, true);
    const days = source.days ?? [];
    const row = await prisma.workoutProgram.create({
      data: {
        trainerId,
        clientId: source.clientId,
        name: `${source.name} (copy)`,
        goal: source.goal,
        startDate: source.startDate,
        endDate: source.endDate,
        daysPerWeek: source.daysPerWeek,
        level: source.level,
        location: source.location,
        equipment: source.equipment,
        observations: source.observations,
        status: "DRAFT",
        days: {
          create: days.map((day) => ({
            name: day.name,
            focus: day.focus,
            estimatedDurationMin: day.estimatedDurationMin,
            warmup: day.warmup,
            cooldown: day.cooldown,
            observations: day.observations,
            sortOrder: day.sortOrder,
            exercises: {
              create: (day.exercises ?? []).map((ex) => ({
                exerciseId: ex.exerciseId,
                customName: ex.customName,
                muscleGroup: ex.muscleGroup,
                category: ex.category,
                sets: ex.sets,
                repsMin: ex.repsMin,
                repsMax: ex.repsMax,
                weight: ex.weight,
                weightUnit: ex.weightUnit,
                restSec: ex.restSec,
                tempo: ex.tempo,
                rpe: ex.rpe,
                rir: ex.rir,
                method: ex.method,
                sortOrder: ex.sortOrder,
                observation: ex.observation,
                videoUrl: ex.videoUrl,
                alternativeText: ex.alternativeText,
              })),
            },
          })),
        },
      },
      include: nestedInclude,
    });
    return this.toProgramDto(row as ProgramRow);
  }

  async duplicateDay(trainerId: string, programId: string, dayId: string) {
    const day = await this.requireDayInProgram(trainerId, programId, dayId);
    const existing = await prisma.workoutDay.findMany({
      where: { programId },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const nextOrder = existing[0] ? existing[0].sortOrder + 1 : 0;
    const row = await prisma.workoutDay.create({
      data: {
        programId,
        name: `${day.name} (copy)`,
        focus: day.focus,
        estimatedDurationMin: day.estimatedDurationMin,
        warmup: day.warmup,
        cooldown: day.cooldown,
        observations: day.observations,
        sortOrder: nextOrder,
        exercises: {
          create: (day.exercises ?? []).map((ex) => ({
            exerciseId: ex.exerciseId,
            customName: ex.customName,
            muscleGroup: ex.muscleGroup,
            category: ex.category,
            sets: ex.sets,
            repsMin: ex.repsMin,
            repsMax: ex.repsMax,
            weight: ex.weight,
            weightUnit: ex.weightUnit,
            restSec: ex.restSec,
            tempo: ex.tempo,
            rpe: ex.rpe,
            rir: ex.rir,
            method: ex.method,
            sortOrder: ex.sortOrder,
            observation: ex.observation,
            videoUrl: ex.videoUrl,
            alternativeText: ex.alternativeText,
          })),
        },
      },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
      },
    });
    return this.toDayDto(row as DayRow);
  }
}

export const workoutsService = new WorkoutsService();
