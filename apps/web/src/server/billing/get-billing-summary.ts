import type { TrainerPlan, TrainerPlanStatus } from "@trainflow/db";
import { prisma } from "@/server/prisma";
import { freeClientLimit, isProEntitled } from "@/server/billing/entitlements";

export type BillingSummary = {
  entitled: boolean;
  plan: TrainerPlan;
  planStatus: TrainerPlanStatus;
  clientCount: number;
  limit: number;
};

export async function getBillingSummary(
  trainerId: string,
): Promise<BillingSummary> {
  const [trainer, clientCount] = await Promise.all([
    prisma.trainer.findUniqueOrThrow({
      where: { id: trainerId },
      select: { plan: true, planStatus: true },
    }),
    prisma.client.count({ where: { trainerId } }),
  ]);

  return {
    entitled: isProEntitled(trainer),
    plan: trainer.plan,
    planStatus: trainer.planStatus,
    clientCount,
    limit: freeClientLimit(),
  };
}

export function isAtClientCap(summary: BillingSummary): boolean {
  return !summary.entitled && summary.clientCount >= summary.limit;
}
