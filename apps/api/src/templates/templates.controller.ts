import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { createClerkClient } from "@clerk/backend";
import { createTemplateFromWorkoutSchema } from "@trainflow/shared-types";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/types/auth-user";
import { TrainersService } from "../trainers/trainers.service";
import { TemplatesService } from "./templates.service";

@Controller("templates")
@UseGuards(AuthGuard, RolesGuard)
@Roles("TRAINER")
export class TemplatesController {
  constructor(
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

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query("q") q?: string,
    @Query("goal") goal?: string,
    @Query("daysPerWeek") daysPerWeek?: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    return this.templates.list(trainerId, { q, goal, daysPerWeek });
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.templates.get(trainerId, id);
  }

  @Post("from-workout/:workoutId")
  @HttpCode(201)
  async createFromWorkout(
    @CurrentUser() user: AuthUser,
    @Param("workoutId") workoutId: string,
    @Body() body: unknown,
  ) {
    const parsed = createTemplateFromWorkoutSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.templates.createFromWorkout(trainerId, workoutId, parsed.data);
  }
}
