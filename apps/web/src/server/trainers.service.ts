
import type { Trainer } from "@trainflow/db";
import { prisma } from "./prisma";

export class TrainersService {

  createFromClerk(input: {
    clerkUserId: string;
    name: string;
    email: string;
  }): Promise<Trainer> {
    return prisma.trainer.upsert({
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
    return prisma.trainer.findUnique({ where: { clerkUserId } });
  }
}

export const trainersService = new TrainersService();
