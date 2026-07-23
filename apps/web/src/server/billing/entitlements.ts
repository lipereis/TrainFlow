import type { Prisma, TrainerPlan, TrainerPlanStatus } from "@trainflow/db";
import { prisma } from "@/server/prisma";
import { forbidden } from "@/server/errors";

type DbClient = Prisma.TransactionClient | typeof prisma;

export function freeClientLimit(): number {
  const raw = process.env.FREE_CLIENT_LIMIT;
  const n = raw ? Number.parseInt(raw, 10) : 2;
  return Number.isFinite(n) && n >= 0 ? n : 2;
}

export function isProEntitled(trainer: {
  plan: TrainerPlan;
  planStatus: TrainerPlanStatus;
}): boolean {
  return (
    trainer.plan === "PRO" &&
    (trainer.planStatus === "ACTIVE" || trainer.planStatus === "PAST_DUE")
  );
}

export async function assertCanCreateClient(
  trainerId: string,
  db: DbClient = prisma,
): Promise<void> {
  const trainer = await db.trainer.findUniqueOrThrow({
    where: { id: trainerId },
    select: { plan: true, planStatus: true },
  });
  if (isProEntitled(trainer)) return;

  const count = await db.client.count({ where: { trainerId } });
  if (count >= freeClientLimit()) {
    throw forbidden(
      "CLIENT_LIMIT_REACHED",
      `Free plan allows up to ${freeClientLimit()} clients. Upgrade to Pro to add more.`,
    );
  }
}
