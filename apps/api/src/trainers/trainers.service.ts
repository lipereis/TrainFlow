import { Injectable } from "@nestjs/common";
import type { Trainer } from "@trainflow/db";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  createFromClerk(input: {
    clerkUserId: string;
    name: string;
    email: string;
  }): Promise<Trainer> {
    return this.prisma.trainer.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        name: input.name,
        email: input.email,
      },
      update: {
        name: input.name,
        email: input.email,
      },
    });
  }

  findByClerkUserId(clerkUserId: string): Promise<Trainer | null> {
    return this.prisma.trainer.findUnique({ where: { clerkUserId } });
  }
}
