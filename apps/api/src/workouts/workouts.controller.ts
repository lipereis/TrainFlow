import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { createClerkClient } from "@clerk/backend";
import {
  createWorkoutFromTemplateSchema,
  createWorkoutSchema,
  executionMethodEnum,
  updateWorkoutSchema,
  workoutDaySchema,
  workoutExerciseSchema,
} from "@trainflow/shared-types";
import { z } from "zod";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/types/auth-user";
import { TrainersService } from "../trainers/trainers.service";
import { TemplatesService } from "../templates/templates.service";
import { WorkoutsService } from "./workouts.service";

const updateDaySchema = workoutDaySchema
  .omit({ exercises: true, id: true })
  .partial();

const updateExerciseSchema = z.object({
  exerciseId: z.string().uuid().optional().nullable(),
  customName: z.string().trim().max(200).optional().nullable(),
  muscleGroup: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  sets: z.number().int().positive().optional(),
  repsMin: z.number().int().positive().optional(),
  repsMax: z.number().int().positive().optional(),
  weight: z.number().min(0).optional().nullable(),
  weightUnit: z.enum(["KG", "LB"]).optional(),
  restSec: z.number().int().min(0).optional().nullable(),
  tempo: z.string().trim().max(50).optional().nullable(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  rir: z.number().min(0).optional().nullable(),
  method: executionMethodEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
  observation: z.string().trim().max(2000).optional().nullable(),
  videoUrl: z.string().trim().url().max(500).optional().nullable(),
  alternativeText: z.string().trim().max(500).optional().nullable(),
});

const moveExerciseSchema = z.object({
  targetDayId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
});

/** Accept shared-types `ids` or plan alias `orderedIds`. */
const reorderBodySchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).optional(),
    orderedIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .transform((v, ctx) => {
    const ids = v.ids ?? v.orderedIds;
    if (!ids || ids.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ids or orderedIds required",
      });
      return z.NEVER;
    }
    return { ids };
  });

function parseOrThrow<T>(
  schema: { safeParse: (data: unknown) => z.SafeParseReturnType<unknown, T> },
  body: unknown,
): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: parsed.error.errors[0]?.message ?? "Invalid body",
    });
  }
  return parsed.data;
}

@Controller("workouts")
@UseGuards(AuthGuard, RolesGuard)
@Roles("TRAINER")
export class WorkoutsController {
  constructor(
    private readonly workouts: WorkoutsService,
    private readonly templates: TemplatesService,
    private readonly trainers: TrainersService,
  ) {}

  private async trainerIdFor(user: AuthUser): Promise<string> {
    const existing = await this.trainers.findByClerkUserId(user.clerkUserId);
    if (existing) return existing.id;

    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    const clerkUser = await clerk.users.getUser(user.clerkUserId);
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Trainer email missing on Clerk user",
      });
    }
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email;
    const created = await this.trainers.createFromClerk({
      clerkUserId: user.clerkUserId,
      name,
      email,
    });
    return created.id;
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const data = parseOrThrow(createWorkoutSchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.create(trainerId, data);
  }

  @Post("from-template/:templateId")
  @HttpCode(201)
  async createFromTemplate(
    @CurrentUser() user: AuthUser,
    @Param("templateId") templateId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(createWorkoutFromTemplateSchema, body);
    const trainerId = await this.trainerIdFor(user);
    const programId = await this.templates.createWorkoutFromTemplate(
      trainerId,
      templateId,
      data,
    );
    return this.workouts.get(trainerId, programId);
  }

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query("clientId") clientId?: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.list(trainerId, clientId);
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.get(trainerId, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(updateWorkoutSchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.update(trainerId, id, data);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    await this.workouts.remove(trainerId, id);
  }

  @Post(":id/duplicate")
  @HttpCode(201)
  async duplicateProgram(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.duplicateProgram(trainerId, id);
  }

  @Put(":id/days/reorder")
  async reorderDays(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(reorderBodySchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.reorderDays(trainerId, id, data.ids);
  }

  @Post(":id/days")
  @HttpCode(201)
  async addDay(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(workoutDaySchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.addDay(trainerId, id, data);
  }

  @Patch(":id/days/:dayId")
  async updateDay(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(updateDaySchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.updateDay(trainerId, id, dayId, data);
  }

  @Delete(":id/days/:dayId")
  @HttpCode(204)
  async removeDay(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    await this.workouts.removeDay(trainerId, id, dayId);
  }

  @Post(":id/days/:dayId/duplicate")
  @HttpCode(201)
  async duplicateDay(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.duplicateDay(trainerId, id, dayId);
  }

  @Put(":id/days/:dayId/exercises/reorder")
  async reorderExercises(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(reorderBodySchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.reorderExercises(trainerId, id, dayId, data.ids);
  }

  @Post(":id/days/:dayId/exercises")
  @HttpCode(201)
  async addExercise(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(workoutExerciseSchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.addExercise(trainerId, id, dayId, data);
  }

  @Patch(":id/days/:dayId/exercises/:exId")
  async updateExercise(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
    @Param("exId") exId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(updateExerciseSchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.updateExercise(trainerId, id, dayId, exId, data);
  }

  @Delete(":id/days/:dayId/exercises/:exId")
  @HttpCode(204)
  async removeExercise(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
    @Param("exId") exId: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    await this.workouts.removeExercise(trainerId, id, dayId, exId);
  }

  @Post(":id/days/:dayId/exercises/:exId/move")
  async moveExercise(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("dayId") dayId: string,
    @Param("exId") exId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(moveExerciseSchema, body);
    const trainerId = await this.trainerIdFor(user);
    return this.workouts.moveExercise(
      trainerId,
      id,
      dayId,
      exId,
      data.targetDayId,
      data.sortOrder,
    );
  }
}
