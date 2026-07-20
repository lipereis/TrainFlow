import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { inviteClientSchema } from "@trainflow/shared-types";
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
    const trainer = await this.trainers.findByClerkUserId(user.clerkUserId);
    if (!trainer) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Trainer profile not found",
      });
    }
    return trainer.id;
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

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.listForTrainer(trainerId);
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.getForTrainer(trainerId, id);
  }
}
