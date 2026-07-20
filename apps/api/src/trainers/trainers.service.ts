import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  createFromClerk(input: {
    clerkUserId: string;
    name: string;
    email: string;
  }) {
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

  findByClerkUserId(clerkUserId: string) {
    return this.prisma.trainer.findUnique({ where: { clerkUserId } });
  }
}
