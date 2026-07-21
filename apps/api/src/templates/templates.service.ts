import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateTemplateFromWorkoutInput,
  CreateWorkoutFromTemplateInput,
} from "@trainflow/shared-types";
import { PrismaService } from "../prisma/prisma.service";

type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type WeightUnit = "KG" | "LB";

type TemplateExerciseRow = {
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

type TemplateDayRow = {
  id: string;
  templateId: string;
  name: string;
  focus: string | null;
  warmup: string | null;
  cooldown: string | null;
  observations: string | null;
  sortOrder: number;
  exercises?: TemplateExerciseRow[];
};

type TemplateRow = {
  id: string;
  trainerId: string | null;
  name: string;
  goal: string | null;
  daysPerWeek: number | null;
  level: ExperienceLevel | null;
  observations: string | null;
  isSample: boolean;
  createdAt: Date;
  updatedAt: Date;
  days?: TemplateDayRow[];
};

export type ListTemplatesQuery = {
  q?: string;
  goal?: string;
  daysPerWeek?: string;
};

const nestedInclude = {
  days: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      exercises: { orderBy: { sortOrder: "asc" as const } },
    },
  },
};

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private toExerciseDto(row: TemplateExerciseRow) {
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

  private toDayDto(row: TemplateDayRow) {
    return {
      id: row.id,
      templateId: row.templateId,
      name: row.name,
      focus: row.focus,
      warmup: row.warmup,
      cooldown: row.cooldown,
      observations: row.observations,
      sortOrder: row.sortOrder,
      exercises: (row.exercises ?? []).map((e) => this.toExerciseDto(e)),
    };
  }

  private toListDto(row: TemplateRow) {
    return {
      id: row.id,
      trainerId: row.trainerId,
      name: row.name,
      goal: row.goal,
      daysPerWeek: row.daysPerWeek,
      level: row.level,
      observations: row.observations,
      isSample: row.isSample,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      dayCount: row.days?.length,
    };
  }

  private toDetailDto(row: TemplateRow) {
    return {
      ...this.toListDto(row),
      days: (row.days ?? []).map((d) => this.toDayDto(d)),
    };
  }

  private async requireAccessibleTemplate(
    trainerId: string,
    templateId: string,
    includeNested = false,
  ): Promise<TemplateRow> {
    const template = await this.prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      ...(includeNested ? { include: nestedInclude } : {}),
    });
    if (!template) {
      throw new NotFoundException({
        code: "TEMPLATE_NOT_FOUND",
        message: "Template not found",
      });
    }
    const accessible =
      template.isSample || template.trainerId === trainerId;
    if (!accessible) {
      throw new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Template not found for this trainer",
      });
    }
    return template as TemplateRow;
  }

  async list(trainerId: string, query: ListTemplatesQuery = {}) {
    const q = query.q?.trim();
    const goal = query.goal?.trim();
    const daysPerWeekRaw = query.daysPerWeek?.trim();
    const daysPerWeek =
      daysPerWeekRaw && !Number.isNaN(Number(daysPerWeekRaw))
        ? Number(daysPerWeekRaw)
        : undefined;

    const rows = await this.prisma.workoutTemplate.findMany({
      where: {
        OR: [{ isSample: true }, { trainerId }],
        ...(q
          ? { name: { contains: q, mode: "insensitive" as const } }
          : {}),
        ...(goal
          ? { goal: { contains: goal, mode: "insensitive" as const } }
          : {}),
        ...(daysPerWeek !== undefined ? { daysPerWeek } : {}),
      },
      include: {
        days: { select: { id: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ isSample: "desc" }, { name: "asc" }],
    });

    return rows.map((r) => this.toListDto(r as TemplateRow));
  }

  async get(trainerId: string, templateId: string) {
    const row = await this.requireAccessibleTemplate(
      trainerId,
      templateId,
      true,
    );
    return this.toDetailDto(row);
  }

  async createFromWorkout(
    trainerId: string,
    workoutId: string,
    input: CreateTemplateFromWorkoutInput = {},
  ) {
    const program = await this.prisma.workoutProgram.findUnique({
      where: { id: workoutId },
      include: nestedInclude,
    });
    if (!program) {
      throw new NotFoundException({
        code: "WORKOUT_NOT_FOUND",
        message: "Workout program not found",
      });
    }
    if (program.trainerId !== trainerId) {
      throw new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Workout not found for this trainer",
      });
    }

    const days = program.days ?? [];
    const row = await this.prisma.workoutTemplate.create({
      data: {
        trainerId,
        isSample: false,
        name: input.name?.trim() || program.name,
        goal: program.goal,
        daysPerWeek: program.daysPerWeek,
        level: program.level,
        observations: program.observations,
        days: {
          create: days.map((day) => ({
            name: day.name,
            focus: day.focus,
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

    return this.toDetailDto(row as TemplateRow);
  }

  async createWorkoutFromTemplate(
    trainerId: string,
    templateId: string,
    input: CreateWorkoutFromTemplateInput,
  ): Promise<string> {
    const template = await this.requireAccessibleTemplate(
      trainerId,
      templateId,
      true,
    );

    const client = await this.prisma.client.findUnique({
      where: { id: input.clientId },
    });
    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        message: "Client not found",
      });
    }
    if (client.trainerId !== trainerId) {
      throw new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Client not found for this trainer",
      });
    }

    const days = template.days ?? [];
    const daysPerWeek =
      template.daysPerWeek && template.daysPerWeek > 0
        ? template.daysPerWeek
        : Math.max(days.length, 1);

    const idsNeedingNames = new Set<string>();
    for (const day of days) {
      for (const ex of day.exercises ?? []) {
        if ((!ex.customName || !ex.customName.trim()) && ex.exerciseId) {
          idsNeedingNames.add(ex.exerciseId);
        }
      }
    }

    const nameByExerciseId = new Map<string, string>();
    if (idsNeedingNames.size > 0) {
      const catalog = await this.prisma.exercise.findMany({
        where: { id: { in: [...idsNeedingNames] } },
        select: { id: true, name: true },
      });
      for (const row of catalog) {
        nameByExerciseId.set(row.id, row.name);
      }
    }

    const resolveCustomName = (ex: TemplateExerciseRow): string | null => {
      const trimmed = ex.customName?.trim();
      if (trimmed) return trimmed;
      if (ex.exerciseId) {
        return nameByExerciseId.get(ex.exerciseId) ?? null;
      }
      return null;
    };

    const today = new Date();
    const startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    const program = await this.prisma.workoutProgram.create({
      data: {
        trainerId,
        clientId: input.clientId,
        name: input.name?.trim() || template.name,
        goal: template.goal,
        startDate,
        endDate: null,
        daysPerWeek,
        level: template.level,
        location: null,
        equipment: null,
        observations: template.observations,
        status: "DRAFT",
        days: {
          create: days.map((day) => ({
            name: day.name,
            focus: day.focus,
            estimatedDurationMin: null,
            warmup: day.warmup,
            cooldown: day.cooldown,
            observations: day.observations,
            sortOrder: day.sortOrder,
            exercises: {
              create: (day.exercises ?? []).map((ex) => ({
                exerciseId: ex.exerciseId,
                customName: resolveCustomName(ex),
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
    });

    return program.id;
  }
}
