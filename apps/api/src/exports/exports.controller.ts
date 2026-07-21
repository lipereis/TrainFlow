import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { createClerkClient } from "@clerk/backend";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/types/auth-user";
import { TrainersService } from "../trainers/trainers.service";
import { PrismaService } from "../prisma/prisma.service";
import { WorkoutsService } from "../workouts/workouts.service";
import { ExcelService } from "./excel.service";
import { PdfService } from "./pdf.service";
import type { ExportPayload } from "./export.types";

@Controller("workouts")
@UseGuards(AuthGuard, RolesGuard)
@Roles("TRAINER")
export class ExportsController {
  constructor(
    private readonly workouts: WorkoutsService,
    private readonly trainers: TrainersService,
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService,
    private readonly pdf: PdfService,
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

  private async loadPayload(
    trainerId: string,
    programId: string,
  ): Promise<ExportPayload> {
    const program = await this.workouts.get(trainerId, programId);
    const [trainer, client] = await Promise.all([
      this.prisma.trainer.findUnique({ where: { id: trainerId } }),
      this.prisma.client.findUnique({ where: { id: program.clientId } }),
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

  @Get(":id/export.xlsx")
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async exportXlsx(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const trainerId = await this.trainerIdFor(user);
    const payload = await this.loadPayload(trainerId, id);
    const buffer = await this.excel.build(payload);
    return new StreamableFile(buffer, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      disposition: `attachment; filename="workout-${id}.xlsx"`,
    });
  }

  @Get(":id/export.pdf")
  @Header("Content-Type", "application/pdf")
  async exportPdf(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const trainerId = await this.trainerIdFor(user);
    const payload = await this.loadPayload(trainerId, id);
    const buffer = await this.pdf.build(payload);
    return new StreamableFile(buffer, {
      type: "application/pdf",
      disposition: `attachment; filename="workout-${id}.pdf"`,
    });
  }
}
