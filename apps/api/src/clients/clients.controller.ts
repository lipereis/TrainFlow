import {
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
  BadRequestException,
} from "@nestjs/common";
import { createClerkClient } from "@clerk/backend";
import {
  inviteClientSchema,
  createClientSchema,
  updateClientSchema,
} from "@trainflow/shared-types";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/types/auth-user";
import { TrainersService } from "../trainers/trainers.service";
import { ClientsService } from "./clients.service";

@Controller("clients")
@UseGuards(AuthGuard, RolesGuard)
@Roles("TRAINER")
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly trainers: TrainersService,
  ) {}

  private async trainerIdFor(user: AuthUser): Promise<string> {
    const existing = await this.trainers.findByClerkUserId(user.clerkUserId);
    if (existing) return existing.id;

    // No webhook locally yet — create trainer on first API use
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

  @Post("invite")
  @HttpCode(201)
  async invite(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = inviteClientSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.clients.invite(trainerId, parsed.data);
  }

  @Post(":id/resend-invite")
  async resend(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.resendInvite(trainerId, id);
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.clients.create(trainerId, parsed.data);
  }

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query("q") q?: string,
  ) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.list(trainerId, q);
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.get(trainerId, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.clients.update(trainerId, id, parsed.data);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    await this.clients.remove(trainerId, id);
  }
}
