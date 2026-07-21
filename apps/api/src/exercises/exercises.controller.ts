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
  Query,
  UseGuards,
} from "@nestjs/common";
import { createClerkClient } from "@clerk/backend";
import { createExerciseSchema } from "@trainflow/shared-types";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/types/auth-user";
import { TrainersService } from "../trainers/trainers.service";
import { ExercisesService } from "./exercises.service";

const updateExerciseSchema = createExerciseSchema.partial();

@Controller("exercises")
@UseGuards(AuthGuard, RolesGuard)
@Roles("TRAINER")
export class ExercisesController {
  constructor(
    private readonly exercises: ExercisesService,
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

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query("q") q?: string,
    @Query("muscle") muscle?: string,
    @Query("category") category?: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    return this.exercises.list(trainerId, { q, muscle, category });
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = createExerciseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.exercises.create(trainerId, parsed.data);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = updateExerciseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.exercises.update(trainerId, id, parsed.data);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    await this.exercises.remove(trainerId, id);
  }
}
